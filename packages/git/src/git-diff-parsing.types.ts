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

export interface FileInfo {
  operation: GitFileOp
  path1: string
  path2?: string
}
