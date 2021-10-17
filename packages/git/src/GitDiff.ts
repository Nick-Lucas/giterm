import fs from 'fs'
import path from 'path'
import _ from 'lodash'
import * as Diff2Html from 'diff2html'

import { Git } from './Git'

import type { DiffFile, DiffResult, FileText } from './GitDiff.types'
import type { GetSpawn } from './types'

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

    const fileType = path.extname(filePath)

    let plainText = null
    if (sha) {
      const cmd = ['show', `${sha}:${filePath}`]
      plainText = await spawn(cmd)
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

  getIndex = async ({ contextLines = 5 } = {}): Promise<DiffResult | null> => {
    const spawn = await this._getSpawn()
    if (!spawn) {
      return null
    }

    // TODO: can we demand this as an input instead to save on 200ms?
    const statusFiles = await this.git.getStatus()

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
