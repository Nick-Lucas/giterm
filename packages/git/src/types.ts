export * from './GitRefs.types'
export * from './GitCommits.types'
export * from './Watcher.types'
export * from './GitDiff.types'
export * from './git-diff-parsing.types'

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

export interface SpawnOpts {
  okCodes?: number[]
}
export type Spawn = (args: string[], opts?: SpawnOpts) => Promise<string>
export type GetSpawn = () => Promise<Spawn | null>

export interface Remote {
  name: string
}
