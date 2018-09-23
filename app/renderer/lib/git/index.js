import NodeGit from 'nodegit'
import SimpleGit from 'simple-git'

import { createHash } from 'crypto'
import Moment from 'moment'
import repoResolver from './repo-resolver'

export class Git {
  // instance management
  // **********************

  updateCwd = (newCwd) => {
    this.cwd = repoResolver(newCwd)
    this._simple = null
    this._complex = null
  }

  getSimple = () => {
    if (!this._simple) {
      try {
        this._simple = new SimpleGit(this.cwd)
      } catch (err) {
        console.error(err)
        this._simple = null
      }
    }
    return this._simple
  }

  getComplex = async () => {
    if (!this._complex) {
      try {
        this._complex = NodeGit.Repository.open(this.cwd)
      } catch (err) {
        console.error(err)
        this._complex = null
      }
    }
    return this._complex
  }

  // methods
  // **********************

  async getStateText() {
    const repo = await this.getComplex()
    if (!repo) {
      return ''
    }

    if (repo.isRebasing()) {
      return 'Rebasing'
    }
    if (repo.isMerging()) {
      return 'Merging'
    }
    if (repo.isCherrypicking()) {
      return 'Cherry Picking'
    }
    if (repo.isReverting()) {
      return 'Reverting'
    }
    if (repo.isBisecting()) {
      return 'Bisecting'
    }
    if (repo.isApplyingMailbox()) {
      return 'Applying Mailbox'
    }
    return 'OK'
  }

  getHeadSHA = async () => {
    const repo = await this.getComplex()
    if (!repo) {
      return ''
    }

    const commit = await repo.getHeadCommit()
    return commit.sha()
  }

  getAllBranches = async () => {
    const repo = await this.getComplex()
    if (!repo) {
      return []
    }

    const refs = await repo.getReferences(NodeGit.Reference.TYPE.OID)
    return Promise.all(
      refs
        .filter((ref) => ref.isBranch() || ref.isRemote())
        .sort(
          (a, b) =>
            a.isRemote() - b.isRemote() || a.name().localeCompare(b.name()),
        )
        .map(async (ref) => {
          const headRef = await ref.peel(NodeGit.Object.TYPE.COMMIT)
          const head = await repo.getCommit(headRef)
          return {
            name: ref.shorthand(),
            isRemote: !!ref.isRemote(),
            isHead: !!ref.isHead(),
            id: ref.name(),
            headSHA: head.sha(),
          }
        }),
    )
  }

  loadAllCommits = async (showRemote, number = 500) => {
    const repo = await this.getComplex()
    if (!repo) {
      return []
    }

    const headSHA = (await repo.head()).target().toString()

    const walker = NodeGit.Revwalk.create(repo)
    walker.sorting(NodeGit.Revwalk.SORT.TOPOLOGICAL, NodeGit.Revwalk.SORT.TIME)
    walker.pushGlob('refs/heads/*')
    if (showRemote) walker.pushGlob('refs/remotes/*')

    const foundCommits = await walker.getCommits(number)

    const hash = createHash('sha1')
    const commits = new Array(foundCommits.length)
    for (let i = 0; i < foundCommits.length; i++) {
      const c = foundCommits[i]
      hash.update(c.sha())

      const date = Moment(c.date())

      commits[i] = {
        sha: c.sha(),
        sha7: c.sha().substring(0, 6),
        message: c.message().split('\n')[0],
        detail: c
          .message()
          .split('\n')
          .splice(1, c.message().split('\n').length)
          .join('\n'),
        date: date.toDate(),
        dateStr: date.format('YYYY/MM/DD HH:mm'),
        time: c.time(),
        committer: c.committer(),
        email: c.author().email(),
        author: c.author().name(),
        authorStr: `${c.author().name()} <${c.author().email()}>`,
        parents: c.parents().map((p) => p.toString()),
        isHead: headSHA === c.sha(),
      }
    }
    return [commits, hash.digest('hex')]
  }

  checkout = async (sha) => {
    const repo = await this.getComplex()
    if (!repo) {
      return
    }

    const branches = await this.getAllBranches(repo)
    const branch = branches.reduce((out, b) => {
      if (!out && b.headSHA === sha) {
        return b.id
      }
      return out
    }, null)

    if (branch) {
      await repo.checkoutBranch(branch)
    } else {
      const simple = this.getSimple()
      await new Promise((resolve) => {
        simple.checkout(sha, () => resolve())
      })
    }
  }

  getStatus = async () => {
    const repo = this.getSimple()
    return new Promise((resolve) => {
      repo.status((err, status) => {
        if (err) {
          console.error(err)
          resolve({ err })
          return
        }
        resolve(status)
      })
    })
  }
}
