export interface DiffStats {
  insertions: number
  deletions: number
  filesChanged: number
}

export type DiffFile = {
  newName: string | null
  oldName: string | null
  isNew: boolean
  isDeleted: boolean
  isModified: boolean
  isRenamed: boolean
}

export interface DiffResult {
  // stats: DiffStats
  files: DiffFile[]
}

export interface FileText {
  path: string
  text: string
  type: string
}
