import _ from 'lodash'
import path from 'path'

import fs from 'fs'
import { spawn } from 'child_process'

import { resolveRepo } from './resolve-repo'

import { STATE, STATE_FILES } from './constants'
import type { GetSpawn, StatusFile, Remote, FileInfo } from './types'

import { GitRefs } from './GitRefs'
import { GitCommits } from './GitCommits'
import { GitDiff } from './GitDiff'
import { parseDiffNameStatusViewWithNulColumns } from './git-diff-parsing'
import { GitUtils } from './GitUtils'

export class Git {
  rawCwd: string
  cwd: string

  readonly refs: GitRefs
  readonly commits: GitCommits
  readonly diff: GitDiff
  readonly utils: GitUtils

  constructor(cwd: string) {
    this.rawCwd = cwd
    this.cwd = resolveRepo(cwd)

    this.refs = new GitRefs(this.cwd, this._getSpawn)
    this.commits = new GitCommits(this.cwd, this._getSpawn, this)
    this.diff = new GitDiff(this.cwd, this._getSpawn, this)
    this.utils = new GitUtils(this._getSpawn)
  }

  _getGitDir = async () => {
    const dir = path.join(this.cwd, '.git')

    const exists = fs.existsSync(dir)
    if (!exists) {
      return null
    }

    return dir
  }

  _getSpawn: GetSpawn = async () => {
    if (this.cwd === '/') {
      return null
    }

    return async (args: string[], { okCodes = [0] } = {}): Promise<string> => {
      const buffers: Buffer[] = []
      const child = spawn('git', args, { cwd: this.cwd })

      return new Promise((resolve, reject) => {
        child.stdout.on('data', (data) => {
          buffers.push(data)
        })

        child.stderr.on('data', (data) => {
          buffers.push(data)
        })

        child.on('close', (code) => {
          const stdtxt = String(Buffer.concat(buffers))
          if (okCodes.includes(code ?? 0)) {
            resolve(stdtxt)
          } else {
            const message = `Spawn failed (status code ${code}) with output:\n\n${stdtxt}`
            console.error(message)
            reject(message)
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
  getStateText = async () => {
    const gitDir = await this._getGitDir()
    if (!gitDir) {
      return STATE.NO_REPO // 'No Repository'
    }

    const exists = (fileOrDir: string) =>
      fs.existsSync(path.join(gitDir, fileOrDir))

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
    const spawn = await this._getSpawn()
    if (!spawn) {
      return ''
    }

    const sha = await spawn(['show', '--format=%H', '-s', 'HEAD'])

    return sha.trim()
  }

  getAllRemotes = async (): Promise<Remote[]> => {
    const spawn = await this._getSpawn()
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

  getStatus = async (): Promise<StatusFile[]> => {
    const spawn = await this._getSpawn()
    if (!spawn) {
      return []
    }

    type FileInfoWithStaged = FileInfo & { staged: boolean }

    const parseNamesWithStaged = (staged: boolean) => (output: string) => {
      return parseDiffNameStatusViewWithNulColumns(output).map((fileInfo) => {
        const extendedFileInfo = fileInfo as FileInfoWithStaged
        extendedFileInfo.staged = staged
        return extendedFileInfo
      })
    }

    const stagedPromise = spawn([
      'diff',
      '--name-status',
      '--staged',
      '-z', // Terminate columns with NUL
    ]).then(parseNamesWithStaged(true))

    const unstagedPromise = spawn([
      'diff',
      '--name-status',
      '-z', // Terminate columns with NUL
    ]).then(parseNamesWithStaged(false))

    // Git Diff cannot show untracked files, so they must be listed separately
    const untrackedPromise = spawn([
      'ls-files',
      '--others',
      '--exclude-standard',
      '-z', // Terminate items with NUL
    ]).then((output) => {
      return output
        .split('\0')
        .filter(Boolean)
        .map<FileInfoWithStaged>((filepath) => ({
          staged: false,
          operation: 'A',
          path1: filepath,
        }))
    })

    const results = await Promise.all([
      stagedPromise,
      unstagedPromise,
      untrackedPromise,
    ])

    return _(results)
      .flatMap()
      .map<StatusFile>((file: FileInfoWithStaged) => {
        let filePath = null
        let oldFilePath = null
        if (file.operation === 'R') {
          oldFilePath = file.path1.trim()
          filePath = file.path2!.trim()
        } else {
          filePath = file.path1.trim()
        }

        return {
          path: filePath,
          oldPath: oldFilePath,
          staged: file.staged,
          unstaged: !file.staged,
          isDeleted: file.operation === 'D',
          isModified: file.operation === 'M',
          isNew: file.operation === 'A',
          isRenamed: file.operation === 'R',
        }
      })
      .sortBy((file: StatusFile) => file.path)
      .value()
  }
}
