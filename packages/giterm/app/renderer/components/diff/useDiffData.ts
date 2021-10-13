import { useMemo, useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Git, DiffResult, DiffFile, FileText } from '@giterm/git'

import { diffFileSelected } from 'app/store/diff/actions'

export type { FileText }

export interface DiffData {
  loading: boolean
  filePath: string
  setFilePath: (path: string) => void
  diff: DiffResult | null
  left: FileText | null
  right: FileText | null
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
  const [left, setLeft] = useState<FileText | null>(null)
  const [right, setRight] = useState<FileText | null>(null)
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
        if (diff) {
          setDiff(diff)
        }

        setLoading(false)
      }
    }

    fetch()

    return () => {
      cancelled = true
    }
  }, [contextLines, cwd, mode, shaNew, shaOld])

  const fileDiff = useMemo<DiffFile | null>(() => {
    if (_filePath) {
      const fileDiff = diff?.files?.find(
        (patch) => (patch.newName ?? patch.oldName) === _filePath,
      )
      return fileDiff ?? null
    } else {
      return diff?.files[0] ?? null
    }
  }, [_filePath, diff?.files])

  useEffect(() => {
    if (!fileDiff) {
      return
    }

    let cancelled = false

    const leftName = fileDiff.oldName
    const rightName = fileDiff.newName

    async function fetch() {
      const git = new Git(cwd)

      let left: FileText | null
      let right: FileText | null
      if (mode === 'shas') {
        const shaOldRelative = shaOld ?? `${shaNew}~1`
        left = await git.getFilePlainText(leftName, shaOldRelative)
        right = await git.getFilePlainText(rightName, shaNew)
      } else {
        left = await git.getFilePlainText(leftName, 'HEAD')
        right = await git.getFilePlainText(rightName)
      }

      if (!cancelled) {
        if (left && right) {
          setLeft(left)
          setRight(right)
        }

        setLoading(false)
      }
    }

    fetch().catch((e) => {
      throw e
    })

    return () => {
      cancelled = true
    }
  }, [cwd, fileDiff, mode, shaNew, shaOld])

  return {
    loading,
    filePath: _filePath,
    setFilePath,
    diff,
    left,
    right,
  }
}
