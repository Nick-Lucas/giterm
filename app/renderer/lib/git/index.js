import _ from 'lodash'
import NodeGit from 'nodegit'
import SimpleGit from 'simple-git'
import chokidar from 'chokidar'
import path from 'path'
import { createHash } from 'crypto'
import Moment from 'moment'

import repoResolver from './repo-resolver'
import { INITIAL_CWD } from '../cwd'

export class Git {
  constructor(cwd = INITIAL_CWD) {
    this.rawCwd = cwd
    this.cwd = repoResolver(cwd)
    this._simple = null
    this._complex = null
    this._watcher = null
  }

  getSimple = () => {
    if (!this._simple) {
      if (this.cwd === '/') {
        return null
      }

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
      if (this.cwd === '/') {
        return null
      }

      try {
        this._complex = await NodeGit.Repository.open(this.cwd)
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
    if (!commit) {
      return ''
    }

    return commit.sha()
  }

  getAllBranches = async () => {
    const repo = await this.getComplex()
    if (!repo) {
      return []
    }

    const refs = await repo.getReferences()
    const branches = await Promise.all(
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

    return _.uniqBy(branches, (branch) => branch.id)
  }

  loadAllCommits = async (showRemote, startIndex = 0, number = 500) => {
    const repo = await this.getComplex()
    if (!repo) {
      return [[], '']
    }

    const headSha = this.getHeadSHA()
    if (!headSha) {
      return []
    }

    const walker = NodeGit.Revwalk.create(repo)
    walker.sorting(NodeGit.Revwalk.SORT.TOPOLOGICAL, NodeGit.Revwalk.SORT.TIME)
    walker.pushGlob('refs/heads/*')
    if (showRemote) walker.pushGlob('refs/remotes/*')

    if (startIndex > 0) {
      await walker.fastWalk(startIndex)
    }
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
        isHead: headSha === c.sha(),
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
      if (!repo) {
        return ''
      }

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

  watchRefs = (callback) => {
    const cwd = this.cwd === '/' ? this.rawCwd : this.cwd
    const gitDir = path.join(cwd, '.git')
    const refsPath = path.join(gitDir, 'refs')

    // Watch the refs themselves
    const watcher = chokidar.watch(refsPath, {
      cwd: gitDir,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 50,
      },
      ignoreInitial: true,
      ignorePermissionErrors: true,
    })

    function processChange(event) {
      return (path) =>
        void callback({
          event,
          ref: path,
          isRemote: path.startsWith('refs/remotes'),
        })
    }
    watcher.on('add', processChange('add'))
    watcher.on('unlink', processChange('unlink'))
    watcher.on('change', processChange('change'))
    watcher.on('error', (err) => console.error('watchRefs error: ', err))

    function repoChange(event) {
      return function(path) {
        if (path === 'refs') {
          processChange(event)(path)
        }
      }
    }
    watcher.on('addDir', repoChange('repo-create'))
    watcher.on('unlinkDir', repoChange('repo-remove'))

    return () => {
      watcher.close()
    }
  }
}
