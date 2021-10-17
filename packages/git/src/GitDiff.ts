import _ from 'lodash'
import * as Diff2Html from 'diff2html'

import { Git } from './Git'

import type { DiffFile, DiffResult, GetSpawn } from './types'

export class GitDiff {
  _cwd: string
  _getSpawn: GetSpawn
  private git: Git

  constructor(cwd: string, getSpawn: GetSpawn, git: Git) {
    this._cwd = cwd
    this._getSpawn = getSpawn
    this.git = git
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
