import fs from 'fs'
import path from 'path'
import _ from 'lodash'

import { Git } from './Git'

import type { DiffFile, DiffResult, FileText } from './GitDiff.types'
import type { GetSpawn } from './types'
import { parseDiffNameStatusViewWithNulColumns } from './git-diff-parsing'

export class GitDiff {
  private _cwd: string
  private _getSpawn: GetSpawn
  private git: Git

  constructor(cwd: string, getSpawn: GetSpawn, git: Git) {
    this._cwd = cwd
    this._getSpawn = getSpawn
    this.git = git
  }

  loadFileText = async (
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

    // Just support git syntax here, but it does need converting internally
    if (sha?.includes('~')) {
      const [childSha] = sha.split('~')
      sha = await this.getShaParent(childSha)
    }

    const fileType = path.extname(filePath)

    let plainText = null
    if (sha) {
      const cmd = ['show', `${sha}:${filePath}`]
      try {
        plainText = await spawn(cmd)
      } catch (err) {
        if (
          /[(' does not exist in ')|( exists on disk, but not in )]/.test(
            String(err),
          )
        ) {
          // If the file is not in the commit, that's fine, it just didn't exist yet and so is empty
          plainText = ''
        } else {
          throw err
        }
      }
    } else {
      const absoluteFilePath = path.join(this._cwd, filePath)
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

  getByShas = async (
    shaNew: string,
    shaOld: string | null = null,
  ): Promise<DiffResult | null> => {
    const spawn = await this._getSpawn()
    if (!spawn) {
      return null
    }

    if (!shaNew) {
      console.error('shaNew was not provided')
      return null
    }

    // While sha~1 syntax can go back a commit for free, it will error for parent-less commits.
    // We look up the parent commit properly so parent-less commits can be compared to the empty tree instead
    if (shaOld == null) {
      shaOld = await this.getShaParent(shaNew)
    }

    const cmd = [
      'diff',
      shaOld,
      shaNew,
      '--name-status',
      '-z', // Terminate columns with NUL
    ]

    const output = await spawn(cmd)
    const files = parseDiffNameStatusViewWithNulColumns(output)

    return {
      files: files.map<DiffFile>((file) => {
        let newName: string | null = null
        let oldName: string | null = null
        if (file.operation === 'R') {
          oldName = file.path1.trim()
          newName = file.path2!.trim()
        } else if (file.operation === 'A') {
          newName = file.path1.trim()
          oldName = null
        } else if (file.operation === 'D') {
          newName = null
          oldName = file.path1.trim()
        } else {
          oldName = file.path1.trim()
          newName = file.path1.trim()
        }

        return {
          newName: newName,
          oldName: oldName,
          isDeleted: file.operation === 'D',
          isModified: file.operation === 'M' || file.operation === 'R',
          isNew: file.operation === 'A',
          isRenamed: file.operation === 'R',
        }
      }),
    }
  }

  getIndex = async (): Promise<DiffResult | null> => {
    const spawn = await this._getSpawn()
    if (!spawn) {
      return null
    }

    const statusFiles = await this.git.getStatus()

    return {
      files: statusFiles.map<DiffFile>((file) => {
        let newName: string | null = null
        let oldName: string | null = null
        if (file.isRenamed) {
          oldName = file.oldPath
          newName = file.path
        } else if (file.isNew) {
          newName = file.path
          oldName = null
        } else if (file.isDeleted) {
          newName = null
          oldName = file.path
        } else {
          oldName = file.path
          newName = file.path
        }

        return {
          newName: newName,
          oldName: oldName,
          isNew: file.isNew,
          isDeleted: file.isDeleted,
          isRenamed: file.isRenamed,
          isModified: file.isModified || file.isRenamed,
        }
      }),
    }
  }

  private emptyTreeShaMemo: string | null = null
  private getEmptyTreeSha = async (): Promise<string> => {
    const spawn = (await this._getSpawn())!

    if (this.emptyTreeShaMemo == null) {
      this.emptyTreeShaMemo = await spawn([
        'hash-object',
        '-t',
        'tree',
        '/dev/null',
      ])
      this.emptyTreeShaMemo = this.emptyTreeShaMemo.trim()
    }

    return this.emptyTreeShaMemo
  }

  private getShaParent = async (sha: string): Promise<string> => {
    const spawn = (await this._getSpawn())!

    const output = await spawn(['rev-list', '--parents', '-n', '1', sha])

    const shas = output.split(/[\s]+/)
    if (shas[0] != sha) {
      throw `getShaParent failed. Unexpected output: "${output}" for input "${sha}"`
    }

    if (!!shas[1]) {
      // Merge commits will have a 3rd element, but but we always want the mainline parent for diffs
      return shas[1]
    } else {
      // Unparented commits will... not have a parent
      return await this.getEmptyTreeSha()
    }
  }
}
