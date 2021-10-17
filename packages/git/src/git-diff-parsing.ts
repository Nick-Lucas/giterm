import { GitFileOp, FileInfo } from './git-diff-parsing.types'

export function parseDiffNameStatusViewWithNulColumns(
  output: string,
): FileInfo[] {
  const segments = output.split('\0').filter(Boolean)

  const lines: [GitFileOp, string, string?][] = []
  while (segments.length > 0) {
    const operation = segments.shift() as string
    const operationKey = operation?.slice(0, 1) as GitFileOp
    if (operationKey === 'R' || operationKey === 'C') {
      const path1 = segments.shift()!
      const path2 = segments.shift()!
      lines.push([operationKey, path1, path2])
    } else if (operationKey) {
      const path1 = segments.shift()!
      lines.push([operationKey, path1])
    }
  }

  return lines.map((line) => ({
    operation: line[0],
    path1: line[1],
    path2: line[2],
  }))
}
