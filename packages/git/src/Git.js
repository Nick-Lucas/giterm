import _ from 'lodash'
import simpleGit from 'simple-git'
import { parse } from 'diff2html'
import chokidar from 'chokidar'
import path from 'path'

import { createHash } from 'crypto'

import fs from 'fs'
import { spawn } from 'child_process'

import repoResolver from './repo-resolver'
import { IsoGit } from './IsoGit'

import { STATE, STATE_FILES } from './constants'

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

  getGitDir = async () => {
    const dir = path.join(this.cwd, '.git')

    const exists = fs.existsSync(dir)
    if (!exists) {
      return null
    }

    return dir
  }

  getSimple = () => {
    if (!this._simple) {
      if (this.cwd === '/') {
        return null
      }

      try {
        perfStart('GIT/open-simple')
        this._simple = simpleGit(this.cwd)
        perfEnd('GIT/open-simple')
      } catch (err) {
        console.error(err)
        this._simple = null
      }
    }

    /** @type {import("simple-git/typings/simple-git").SimpleGit} */
    const simple = this._simple

    return simple
  }

  getIsoGit = () => {
    if (!this._isogit) {
      if (this.cwd === '/') {
        return null
      }

      try {
        perfStart('GIT/open-complex')
        this._isogit = new IsoGit(this.cwd)
        perfEnd('GIT/open-complex')
      } catch (err) {
        console.error(err)
        this._isogit = null
      }
    }
    return this._isogit
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

  /**
   * Loosely based on libgit2: `git_repository_state`
   * https://github.com/libgit2/libgit2/blob/3addb796d392ff6bbd3917a48d81848d40821c5b/src/repository.c#L2956
   */
  async getStateText() {
    const gitDir = await this.getGitDir()
    if (!gitDir) {
      return STATE.NO_REPO // 'No Repository'
    }

    const exists = (fileOrDir) => fs.existsSync(path.join(gitDir, fileOrDir))

    if (exists(STATE_FILES.REBASE_MERGE_INTERACTIVE_FILE)) {
      return STATE.REBASING
    }
    if (exists(STATE_FILES.REBASE_MERGE_DIR)) {
      return STATE.REBASING
    }
    if (exists(STATE_FILES.REBASE_APPLY_REBASING_FILE)) {
      return STATE.REBASING
    }
    if (exists(STATE_FILES.REBASE_APPLY_APPLYING_FILE)) {
      return STATE.APPLYING_MAILBOX
    }
    if (exists(STATE_FILES.REBASE_APPLY_DIR)) {
      return STATE.REBASING
    }
    if (exists(STATE_FILES.MERGE_HEAD_FILE)) {
      return STATE.MERGING
    }
    if (exists(STATE_FILES.REVERT_HEAD_FILE)) {
      return STATE.REVERTING
    }
    if (exists(STATE_FILES.CHERRYPICK_HEAD_FILE)) {
      return STATE.CHERRY_PICKING
    }
    if (exists(STATE_FILES.BISECT_LOG_FILE)) {
      return STATE.BISECTING
    }

    return STATE.OK // 'OK'
  }

  getHeadSHA = async () => {
    const spawn = await this.getSpawn()
    if (!spawn) {
      return ''
    }

    const sha = await spawn(['show', '--format=%H', '-s', 'HEAD'])

    return sha.trim()
  }

  getAllBranches = async () => {
    const spawn = await this.getSpawn()
    if (!spawn) {
      return []
    }

    // Based on
    // git branch --list --all --format="[%(HEAD)] -SHA- %(objectname) -local- %(refname) %(refname:short) -date- %(committerdate:iso) -upstream- %(upstream) %(upstream:track)" -q --sort=-committerdate

    const SEP = '----e16409c0-8a85-4a6c-891d-8701f48612d8----'
    const format = [
      '%(HEAD)',
      '%(objectname)',
      '%(refname)',
      '%(refname:short)',
      '%(authordate:unix)',
      '%(committerdate:unix)',
      '%(upstream)',
      '%(upstream:short)',
      '%(upstream:track)',
    ]

    const fragments = [
      'branch',
      '--list',
      '--all',
      '--sort=-committerdate',
      `--format=${format.join(SEP)}`,
    ]

    const result = await spawn(fragments)

    const tuples = result
      .split(/\r\n|\r|\n/g)
      .filter(Boolean)
      .map((str) => str.split(SEP))

    const refs = tuples.map((segments) => {
      if (segments.length !== format.length) {
        console.warn(segments)
        throw `Separator ${SEP} in output, cannot parse git branches. ${segments.length} segments found, ${format.length} expected. Values: ${segments}`
      }

      const [
        isHead,
        sha,
        refId,
        name,
        authorDate,
        commitDate,
        upstreamId,
        upstreamName,
        upstreamDiff,
      ] = segments

      let upstream = null
      if (upstreamId) {
        upstream = {
          id: upstreamId,
          name: upstreamName,
          ahead: parseInt(/ahead (\d+)/.exec(upstreamDiff)?.[1] ?? 0),
          behind: parseInt(/behind (\d+)/.exec(upstreamDiff)?.[1] ?? 0),
        }
      }

      return {
        id: refId,
        name: name,
        isRemote: refId.startsWith('refs/remotes'),
        isHead: isHead === '*',
        headSHA: sha,
        date: commitDate,
        authorDate: authorDate,
        upstream: upstream,
      }
    })

    return _(refs)
      .uniqBy((branch) => branch.id)
      .sortBy([
        (branch) => branch.isRemote,
        (branch) => -branch.date,
        (branch) => branch.name,
      ])
      .value()
  }

  getAllTags = async () => {
    const spawn = await this.getSpawn()
    if (!spawn) {
      return []
    }

    // Based on
    // git tag --list  --format="-SHA- %(objectname) -local- %(refname) %(refname:short) -date- %(committerdate:iso)" --sort=-committerdate

    const SEP = '----e16409c0-8a85-4a6c-891d-8701f48612d8----'
    const format = [
      '%(objectname)',
      '%(refname)',
      '%(refname:short)',
      '%(authordate:unix)',
      '%(committerdate:unix)',
    ]

    const fragments = [
      'tag',
      '--list',
      '--sort=-committerdate',
      `--format=${format.join(SEP)}`,
    ]

    const result = await spawn(fragments)

    const tuples = result
      .split(/\r\n|\r|\n/g)
      .filter(Boolean)
      .map((str) => str.split(SEP))

    const refs = tuples.map((segments) => {
      if (segments.length !== format.length) {
        console.warn(segments)
        throw `Separator ${SEP} in output, cannot parse git tags. ${segments.length} segments found, ${format.length} expected. Values: ${segments}`
      }

      const [sha, id, name, authorDate, committerDate] = segments

      return {
        id,
        name,
        headSHA: sha,
        date: committerDate,
        authorDate: authorDate,
      }
    })

    return _.sortBy(refs, [(tag) => -tag.date, (tag) => tag.name])
  }

  getAllRemotes = async () => {
    const spawn = await this.getSpawn()
    if (!spawn) {
      return []
    }

    const cmd = ['remote']

    const output = await spawn(cmd)

    return output
      .split(/\r\n|\r|\n/g)
      .filter(Boolean)
      .map((remote) => {
        return {
          name: remote,
        }
      })
  }

  loadAllCommits = async (showRemote, startIndex = 0, number = 500) => {
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

  // FIXME: does not work, but also onDoubleClick on Commit is not working due to a conflict with onClick
  checkout = async (sha) => {
    const simple = this.getSimple()
    if (!simple) {
      return
    }

    const branches = await this.getAllBranches()
    const branch = branches.find((b) => {
      return b.headSHA === sha
    })

    if (branch) {
      simple.checkoutBranch(branch.name)
    } else {
      simple.checkout(sha)
    }
  }

  getStatus = async () => {
    const ig = this.getIsoGit()
    if (!ig) {
      return []
    }

    return await ig.status()
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

  /**
   * @typedef DiffResult
   * @property { {insertions: number, deletions: number, filesChanges: number} } stats
   * @property {import("diff2html/lib-esm/types").DiffFile[]} files
   */

  /**
   * @param {string} shaOld
   * @param {string} shaNew
   * @returns {Promise<DiffResult>}
   */
  getDiffFromShas = async (
    shaNew,
    shaOld = null,
    { contextLines = 10 } = {},
  ) => {
    const spawn = await this.getSpawn()
    if (!spawn) {
      return null
    }

    // From Git:
    // git diff SHAOLD SHANEW --unified=10
    // git show SHA --patch -m

    if (!shaNew) {
      console.error('shaNew was not provided')
      return null
    }

    let cmd = []
    if (shaOld) {
      cmd = ['diff', shaOld, shaNew, '--unified=' + contextLines]
    } else {
      cmd = [
        'show',
        shaNew,
        '--patch', // Always show patch
        '-m', // Show patch even on merge commits
        '--unified=' + contextLines,
      ]
    }

    const patchText = await spawn(cmd)
    const diff = this._processDiff(patchText)

    return diff
  }

  /**
   * @returns {Promise<DiffResult>}
   */
  getDiffFromIndex = async ({ contextLines }) => {
    const spawn = await this.getSpawn()
    if (!spawn) {
      return null
    }

    const cmd = ['diff', '--unified=' + contextLines]

    const patchText = await spawn(cmd)
    const diff = this._processDiff(patchText)

    return diff
  }

  _processDiff = (diffText) => {
    const files = parse(diffText)

    return {
      stats: {
        insertions: files.reduce((result, file) => file.addedLines + result, 0),
        filesChanged: files.length,
        deletions: files.reduce(
          (result, file) => file.deletedLines + result,
          0,
        ),
      },
      files,
    }
  }
}
