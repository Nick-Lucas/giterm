import _ from 'lodash'
import fp from 'lodash/fp'
import NodeGit from 'nodegit'
import SimpleGit from 'simple-git'
import chokidar from 'chokidar'
import path from 'path'
import { createHash } from 'crypto'

import { spawn } from 'child_process'

import repoResolver from './repo-resolver'

import { STATE } from './constants'

const PROFILING = true
function perfStart(name) {
  performance.mark(name + '/start')
}
function perfEnd(name) {
  performance.mark(name + '/end')
  performance.measure(name, name + '/start', name + '/end')
}
if (process.env.NODE_ENV !== 'development' || !PROFILING) {
  perfStart = function() {}
  perfEnd = function() {}
}

export class Git {
  constructor(cwd) {
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
        perfStart('GIT/open-simple')
        this._simple = new SimpleGit(this.cwd)
        perfEnd('GIT/open-simple')
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
        perfStart('GIT/open-complex')
        this._complex = await NodeGit.Repository.open(this.cwd)
        perfEnd('GIT/open-complex')
      } catch (err) {
        console.error(err)
        this._complex = null
      }
    }
    return this._complex
  }

  getSpawn = async () => {
    if (this.cwd === '/') {
      return null
    }

    return async (args) => {
      const buffers = []
      const child = spawn('git', args, { cwd: this.cwd })

      return new Promise((resolve, reject) => {
        child.stdout.on('data', (data) => {
          buffers.push(data)
        })

        child.stderr.on('data', (data) => {
          console.error('STDERR', String(data))
        })

        child.on('close', (code) => {
          if (code == 0) {
            resolve(String(Buffer.concat(buffers)))
          } else {
            reject()
          }
        })
      })
    }
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
        refs
          .filter((ref) => ref.isTag())
          .map(async (ref) => {
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
      return [[], '']
    }

    const spawn = await this.getSpawn()
    if (!spawn) {
      return [[], '']
    }

    const SEP = '----e16409c0-8a85-4a6c-891d-8701f48612d8----'
    const FORMAT_SEGMENTS_COUNT = 6
    const cmd = [
      '--no-pager',
      'log',
      `--format=%H${SEP}%P${SEP}%aN${SEP}%aE${SEP}%aI${SEP}%s`,
      '--branches=*',
      '--tags=*',
      showRemote && '--remotes=*',
      `--skip=${startIndex}`,
      `--max-count=${number}`,
    ].filter(Boolean)

    perfStart('GIT/log/spawn')
    const result = await spawn(cmd)
    perfEnd('GIT/log/spawn')

    perfStart('GIT/log/sanitise-result')
    const tuples = result
      .split(/\r\n|\r|\n/g)
      .filter(Boolean)
      .map((str) => str.split(SEP))
    perfEnd('GIT/log/sanitise-result')

    perfStart('GIT/log/deserialise')
    const commits = new Array(tuples.length)
    const hash = createHash('sha1')
    for (let i = 0; i < tuples.length; i++) {
      const formatSegments = tuples[i]
      if (formatSegments.length !== FORMAT_SEGMENTS_COUNT) {
        throw `Separator ${SEP} in output, cannot parse git history. ${formatSegments.length} segments found, ${FORMAT_SEGMENTS_COUNT} expected. Values: ${formatSegments}`
      }

      const [
        sha,
        parentShasStr,
        authorName,
        authorEmail,
        authorDateISO,
        subject,
      ] = formatSegments
      const parentShas = parentShasStr.split(' ').filter(Boolean)
      const author = `${authorName} <${authorEmail}>`

      commits[i] = {
        sha: sha,
        sha7: sha.substring(0, 6),
        message: subject,
        dateISO: authorDateISO,
        email: authorEmail,
        author: authorName,
        authorStr: author,
        parents: parentShas,
        isHead: headSha === sha,
      }

      hash.update(sha)
    }
    perfEnd('GIT/log/deserialise')

    perfStart('GIT/digest-finalise')
    const digest = hash.digest('hex')
    perfEnd('GIT/digest-finalise')

    return [commits, digest]
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
