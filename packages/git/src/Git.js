import _ from 'lodash'
import fp from 'lodash/fp'
import NodeGit from 'nodegit'
import SimpleGit from 'simple-git'
import chokidar from 'chokidar'
import path from 'path'
import { createHash } from 'crypto'
import Moment from 'moment'

import repoResolver from './repo-resolver'
import { INITIAL_CWD } from '../cwd'

import { STATE } from './constants'

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
      return STATE.NO_REPO // 'No Repository'
    }

    if (repo.isRebasing()) {
      return STATE.REBASING // 'Rebasing'
    }
    if (repo.isMerging()) {
      return STATE.MERGING // 'Merging'
    }
    if (repo.isCherrypicking()) {
      return STATE.CHERRY_PICKING // 'Cherry Picking'
    }
    if (repo.isReverting()) {
      return STATE.REVERTING // 'Reverting'
    }
    if (repo.isBisecting()) {
      return STATE.BISECTING // 'Bisecting'
    }
    if (repo.isApplyingMailbox()) {
      return STATE.APPLYING_MAILBOX // 'Applying Mailbox'
    }
    return STATE.OK // 'OK'
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

    const refs = await Promise.all(
      await repo.getReferences().then((refs) =>
        refs
          .filter((ref) => ref.isBranch() || ref.isRemote())
          .map(async (ref) => {
            const id = ref.name()
            const simpleName = _.last(id.match(/.*\/(.*$)/))

            const commitRef = await ref.peel(NodeGit.Object.TYPE.COMMIT)
            const commit = await repo.getCommit(commitRef)

            let upstream = null
            const upstreamRef = await NodeGit.Branch.upstream(ref).catch(
              () => null,
            )
            if (upstreamRef) {
              const { ahead, behind } = await NodeGit.Graph.aheadBehind(
                repo,
                ref.target(),
                upstreamRef.target(),
              )

              upstream = {
                name: upstreamRef.name(),
                ahead,
                behind,
              }
            }

            return {
              id,
              name: ref.shorthand(),
              simpleName,
              isRemote: !!ref.isRemote(),
              isHead: !!ref.isHead(),
              headSHA: ref.target().tostrS(),
              date: commit.date(),
              upstream,
            }
          }),
      ),
    )

    return fp.flow(
      fp.uniqBy((branch) => branch.id),
      fp.sortBy([
        (branch) => branch.isRemote,
        (branch) => -branch.date,
        (branch) => branch.name,
      ]),
    )(refs)
  }

  getAllTags = async () => {
    const repo = await this.getComplex()
    if (!repo) {
      return []
    }

    const refs = await Promise.all(
      await repo.getReferences().then((refs) =>
        refs.filter((ref) => ref.isTag()).map(async (ref) => {
          const id = ref.name()
          const commitRef = await ref.peel(NodeGit.Object.TYPE.COMMIT)
          const commit = await repo.getCommit(commitRef)

          return {
            id,
            name: ref.shorthand(),
            headSHA: ref.target().tostrS(),
            date: commit.date(),
          }
        }),
      ),
    )

    return _.sortBy(refs, [(tag) => -tag.date, (tag) => tag.name])
  }

  getAllRemotes = async () => {
    const repo = await this.getComplex()
    if (!repo) {
      return []
    }

    const remotes = await repo.getRemotes()

    return remotes.map((remote) => {
      return {
        name: remote.name(),
      }
    })
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
    const repo = await this.getComplex()
    if (!repo) {
      return []
    }

    const files = await repo.getStatus()

    return files.map((file) => {
      return {
        path: file.path(),
        staged: !!file.inIndex(),
        isNew: !!file.isNew(),
        isDeleted: !!file.isDeleted(),
        isModified: !!file.isModified(),
        isRenamed: !!file.isRenamed() || !!file.isTypechange(),
        isIgnored: !!file.isIgnored(),
      }
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

    // Watch individual refs
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

    // Watch for repo destruction and creation
    function repoChange(event) {
      return function(path) {
        if (path === 'refs') {
          processChange(event)(path)
        }
      }
    }
    watcher.on('addDir', repoChange('repo-create'))
    watcher.on('unlinkDir', repoChange('repo-remove'))

    watcher.on('error', (err) => console.error('watchRefs error: ', err))

    return () => {
      watcher.close()
    }
  }
}
