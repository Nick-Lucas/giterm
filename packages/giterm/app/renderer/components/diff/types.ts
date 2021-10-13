import { DiffResult, DiffFile } from '@giterm/git'

export type { DiffResult }

export type DiffLine = DiffFile['blocks'][0]['lines'][0]

export type FilePatchBlock = DiffFile['blocks'][0] & {
  linesLeft: DiffLine[]
  linesRight: DiffLine[]
}

type Modify<T, R> = Omit<T, keyof R> & R
export type FilePatch = Modify<
  DiffFile,
  {
    selectedFileName: string
    blocks: FilePatchBlock[]
  }
>
