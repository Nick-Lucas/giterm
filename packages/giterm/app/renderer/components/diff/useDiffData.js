import { useMemo, useState, useEffect } from 'react'

import { Git } from '@giterm/git'
import { useSelector } from 'react-redux'

export function useDiffData(mode, { shaNew, shaOld, contextLines = 5 } = {}) {
  const cwd = useSelector((state) => state.config.cwd)

  const [_filePath, setFilePath] = useState(null)

  const [loading, setLoading] = useState(true)
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    let cancelled = false

    async function fetch() {
      const git = new Git(cwd)

      const diff =
        mode === 'shas'
          ? await git.getDiffFromShas(shaNew, shaOld, {
              contextLines,
            })
          : await git.getDiffFromIndex({ contextLines })

      if (!cancelled) {
        setDiff(diff)
        setLoading(false)
      }
    }

    fetch()

    return () => {
      cancelled = true
    }
  }, [contextLines, cwd, mode, shaNew, shaOld])

  const filePath = useMemo(() => {
    if (
      !_filePath ||
      !diff?.patches?.some((patch) => patch.newFilePath === _filePath)
    ) {
      return diff?.patches[0]?.newFilePath ?? null
    } else {
      return _filePath
    }
  }, [_filePath, diff?.patches])

  const filePatch = useMemo(() => {
    if (!diff) return null

    const patch = diff.patches.find(
      (patch) =>
        patch.oldFilePath === filePath || patch.newFilePath === filePath,
    )

    const filePatch = { ...patch, selectedFilePath: filePath, hunks: [] }
    if (!patch) return filePatch

    for (const hunk of patch.hunks) {
      const linesLeft = []
      const linesRight = []

      for (const line of hunk.lines) {
        const isLeft = line.oldLineno >= 0
        const isRight = line.newLineno >= 0

        // Where line has not changed at-all we fix the row to the same index in both columns
        if (isLeft && isRight && line.contentOffset < 0) {
          const headIndex = Math.max(linesLeft.length, linesRight.length)
          linesLeft[headIndex] = line
          linesRight[headIndex] = line
          continue
        }

        // Otherwise push one at a time to keep the diff compact
        if (isLeft) {
          linesLeft.push(line)
        }
        if (isRight) {
          linesRight.push(line)
        }
      }

      filePatch.hunks.push({ ...hunk, linesLeft, linesRight })
    }

    return filePatch
  }, [diff, filePath])

  return {
    loading,
    filePath,
    setFilePath,
    diff,
    filePatch,
  }
}
