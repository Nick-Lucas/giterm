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
  oldPath: string | null
  staged: boolean
  unstaged: boolean
  isNew: boolean
  isDeleted: boolean
  isModified: boolean
  isRenamed: boolean
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

type Modify<T, R> = Omit<T, keyof R> & R
export interface DiffStats {
  insertions: number
  deletions: number
  filesChanged: number
}
export type DiffFile = Modify<
  Diff2Html.DiffFile,
  {
    newName: string | null
    oldName: string | null
    isModified: boolean
  }
>
export interface DiffResult {
  stats: DiffStats
  files: DiffFile[]
}

export type GitFileOp =
  | 'A' // Added
  | 'C' // Copied
  | 'D' // Deleted
  | 'M' // Modified
  | 'R' // Renamed
  | 'T' // Type changed
  | 'U' // Unmerged
  | 'X' // Unknown
  | 'B' // Broken
  | undefined
