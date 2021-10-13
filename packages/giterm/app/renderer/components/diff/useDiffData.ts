import { useMemo, useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Git, DiffResult } from '@giterm/git'

import { diffFileSelected } from 'app/store/diff/actions'

import { DiffLine, FilePatch } from './types'

export interface DiffData {
  loading: boolean
  filePath: string | null
  setFilePath: (path: string) => void
  diff: DiffResult | null
  filePatch: FilePatch | null
}

export function useDiffData({ contextLines = 5 } = {}): DiffData {
  const dispatch = useDispatch()
  const cwd = useSelector((state: any) => state.config.cwd)
  const {
    mode,
    shas: [shaNew, shaOld = null] = [],
    filePath: _filePath,
  } = useSelector((state: any) => state.diff)

  const setFilePath = useCallback(
    (filePath) => {
      dispatch(diffFileSelected(filePath))
    },
    [dispatch],
  )

  const [loading, setLoading] = useState(true)
  const [diff, setDiff] = useState<DiffResult | null>(null)
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
        diff != null && setDiff(diff)
        setLoading(false)
      }
    }

    fetch()

    return () => {
      cancelled = true
    }
  }, [contextLines, cwd, mode, shaNew, shaOld])

  const filePath = useMemo<string | null>(() => {
    if (
      !_filePath ||
      !diff?.files?.some(
        (patch) => (patch.newName ?? patch.oldName) === _filePath,
      )
    ) {
      return diff?.files[0]?.newName ?? null
    } else {
      return _filePath
    }
  }, [_filePath, diff?.files])

  const filePatch = useMemo<FilePatch | null>(() => {
    if (!diff || !filePath) {
      return null
    }
    const file = diff.files.find(
      (file) => file.oldName === filePath || file.newName === filePath,
    )
    if (!file) {
      return null
    }

    const filePatch: FilePatch = {
      ...file,
      selectedFileName: filePath,
      blocks: [],
    }

    for (const block of file.blocks) {
      const linesLeft: DiffLine[] = []
      const linesRight: DiffLine[] = []

      for (const line of block.lines) {
        const isLeft = typeof line.oldNumber === 'number' && line.oldNumber >= 0
        const isRight =
          typeof line.newNumber === 'number' && line.newNumber >= 0

        // Where line has not changed at-all we fix the row to the same index in both columns
        if (isLeft && isRight) {
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

      filePatch.blocks.push({ ...block, linesLeft, linesRight })
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
