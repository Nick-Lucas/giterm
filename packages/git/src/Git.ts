import _ from 'lodash'
import * as Diff2Html from 'diff2html'
import chokidar from 'chokidar'
import path from 'path'

import fs from 'fs'
import { spawn } from 'child_process'

import { resolveRepo } from './resolve-repo'

import { STATE, STATE_FILES } from './constants'
import type {
  DiffFile,
  DiffResult,
  GitFileOp,
  GetSpawn,
  StatusFile,
  FileText,
  Remote,
} from './types'

import { GitRefs } from './GitRefs'
import { GitCommits } from './GitCommits'
import { Watcher } from './Watcher'
import { perfStart, instrumentClass } from './performance'

export class Git {
  rawCwd: string
  cwd: string
  _watcher: chokidar.FSWatcher | null = null

  readonly refs: GitRefs
  readonly commits: GitCommits
  readonly watcher: Watcher

  constructor(cwd: string) {
    this.rawCwd = cwd
    this.cwd = resolveRepo(cwd)

    this.refs = new GitRefs(this.cwd, this._getSpawn)
    this.commits = new GitCommits(this.cwd, this._getSpawn, this)
    this.watcher = new Watcher(this.cwd)

    instrumentClass(this)
    instrumentClass(this.refs)
    instrumentClass(this.commits)
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
      const perf = perfStart('GIT/spawn/git ' + args.join(' '))

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
          perf.done()

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

    interface FileInfo {
      staged: boolean
      operation: GitFileOp
      path1: string
      path2?: string
    }

    const parseNamesWithStaged =
      (staged: boolean) =>
      (output: string): FileInfo[] => {
        const segments = output.split('\0').filter(Boolean)

        const lines: [GitFileOp, string, string?][] = []
        while (segments.length > 0) {
          const operation = segments.shift() as string
          const operationKey = operation?.slice(0, 1) as GitFileOp
          if (operationKey === 'R' || operationKey === 'C') {
            const path1 = segments.shift()!
            const path2 = segments.shift()!
            lines.push([operationKey, path1, path2])
          } else if (operationKey) {
            const path1 = segments.shift()!
            lines.push([operationKey, path1])
          }
        }

        return lines.map((line) => ({
          staged,
          operation: line[0],
          path1: line[1],
          path2: line[2],
        }))
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
        .map<FileInfo>((filepath) => ({
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
      .map<StatusFile>((file: FileInfo) => {
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

  getFilePlainText = async (
    filePath: string | null,
    sha: string | null = null,
  ): Promise<FileText | null> => {
    const spawn = await this._getSpawn()
    if (!spawn) {
      return null
    }

    if (!filePath) {
      return {
        path: '',
        type: '',
        text: '',
      }
    }

    const fileType = path.extname(filePath)

    let plainText = null
    if (sha) {
      const cmd = ['show', `${sha}:${filePath}`]
      plainText = await spawn(cmd)
    } else {
      const absoluteFilePath = path.join(this.cwd, filePath)
      plainText = await new Promise<string>((resolve, reject) => {
        fs.readFile(absoluteFilePath, (err, data) => {
          err ? reject(err) : resolve(data.toString())
        })
      })
    }

    return {
      path: filePath,
      text: plainText,
      type: fileType,
    }
  }

  getDiffFromShas = async (
    shaNew: string,
    shaOld: string | null = null,
    { contextLines = 10 } = {},
  ): Promise<DiffResult | null> => {
    const spawn = await this._getSpawn()
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
    const diff = await this.processDiff(patchText)

    return diff
  }

  getDiffFromIndex = async ({
    contextLines = 5,
  } = {}): Promise<DiffResult | null> => {
    const spawn = await this._getSpawn()
    if (!spawn) {
      return null
    }

    const statusFiles = await this.getStatus()

    const diffTexts = await Promise.all(
      statusFiles.map(async (statusFile) => {
        const cmd = ['diff', '--unified=' + contextLines]

        if (statusFile.isNew) {
          // Has to be compared to an empty file
          cmd.push('/dev/null', statusFile.path)
        } else if (statusFile.isDeleted) {
          // Has to be compared to current HEAD tree
          cmd.push('HEAD', '--', statusFile.path)
        } else if (statusFile.isModified) {
          // Compare back to head
          cmd.push('HEAD', statusFile.path)
        } else if (statusFile.isRenamed) {
          // Have to tell git diff about the rename
          cmd.push('HEAD', '--', statusFile.oldPath!, statusFile.path)
        }

        return await spawn(cmd, { okCodes: [0, 1] })
      }),
    )

    const diffText = diffTexts.join('\n')

    const diff = await this.processDiff(diffText)

    return diff
  }

  private processDiff = async (diffText: string): Promise<DiffResult> => {
    const files = Diff2Html.parse(diffText) as DiffFile[]

    for (const file of files) {
      if (file.oldName === '/dev/null') {
        file.oldName = null
      }
      if (file.newName === '/dev/null') {
        file.newName = null
      }

      // Diff2Html doesn't attach false values, so patch these on
      file.isNew = !!file.isNew
      file.isDeleted = !!file.isDeleted
      file.isRename = !!file.isRename
      file.isModified = !file.isNew && !file.isDeleted
    }

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
