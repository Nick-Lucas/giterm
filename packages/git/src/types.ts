export * from './GitRefs.types'
export * from './GitCommits.types'
export * from './Watcher.types'
export * from './GitDiff.types'

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

export interface FileText {
  path: string
  text: string
  type: string
}

export interface SpawnOpts {
  okCodes?: number[]
}
export type Spawn = (args: string[], opts?: SpawnOpts) => Promise<string>
export type GetSpawn = () => Promise<Spawn | null>

export interface Remote {
  name: string
}
