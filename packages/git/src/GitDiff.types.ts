import * as Diff2Html from 'diff2html/lib-esm/types'

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

export interface FileText {
  path: string
  text: string
  type: string
}
