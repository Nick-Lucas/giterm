import * as Diff2Html from 'diff2html/lib-esm/types'

export type WatcherEvent =
  | 'add'
  | 'unlink'
  | 'change'
  | 'repo-create'
  | 'repo-remove'
export type WatcherCallback = (data: {
  event: string
  ref: string
  isRemote: boolean
}) => void

export interface StatusFile {
  path: string
  staged: boolean
  unstaged: boolean
  isNew: boolean
  isDeleted: boolean
  isModified: boolean
}

export interface Commit {
  sha: string
  sha7: string
  message: string
  dateISO: string
  email: string
  author: string
  authorStr: string
  parents: string[]
  isHead: boolean
}

export interface DiffResult {
  stats: {
    insertions: number
    deletions: number
    filesChanged: number
  }
  files: Diff2Html.DiffFile[]
}
