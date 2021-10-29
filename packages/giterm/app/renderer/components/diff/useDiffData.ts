import { useMemo, useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'app/store'
import { Git, DiffResult, DiffFile, FileText } from '@giterm/git'

import { diffFileSelected } from 'app/store/diff/actions'
import { setWindowTitle } from 'app/lib/title'
import { Worker } from 'main/git-worker'

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
  const cwd = useSelector((state) => state.config.cwd)
  const {
    mode,
    shas: [shaNew, shaOld = null] = [],
    filePath: _filePath,
  } = useSelector((state) => state.diff)

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

    async function fetchDiff() {
      const diff =
        mode === 'shas'
          ? await Worker.diff.getByShas(cwd, [shaNew, shaOld])
          : await Worker.diff.getIndex(cwd, [])

      if (!cancelled) {
        if (diff) {
          setDiff(diff)
        }

        setLoading(false)
      }
    }

    fetchDiff()

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

  const fileName = _filePath || fileDiff?.newName || fileDiff?.oldName || ''

  useEffect(() => {
    if (!fileDiff) {
      return
    }

    let cancelled = false

    const leftName = fileDiff.oldName
    const rightName = fileDiff.newName

    async function fetch() {
      let leftPromise: Promise<FileText | null>
      let rightPromise: Promise<FileText | null>
      if (mode === 'shas') {
        const shaOldRelative = shaOld ?? `${shaNew}~1`
        leftPromise = Worker.diff.loadFileText(cwd, [leftName, shaOldRelative])
        rightPromise = Worker.diff.loadFileText(cwd, [rightName, shaNew])
      } else {
        leftPromise = Worker.diff.loadFileText(cwd, [leftName, 'HEAD'])
        rightPromise = Worker.diff.loadFileText(cwd, [rightName])
      }

      const [left, right] = await Promise.all([leftPromise, rightPromise])

      if (!cancelled) {
        if (left && right) {
          setLeft(left)
          setRight(right)
        }

        setLoading(false)
      }
    }

    fetch().catch((e) => {
      console.warn(e)
    })

    return () => {
      cancelled = true
    }
  }, [cwd, fileDiff, mode, shaNew, shaOld])

  useEffect(() => {
    const oldName = fileDiff?.oldName
    const newName = fileDiff?.newName

    const isRenamed = oldName !== newName

    let title: string
    if (isRenamed) {
      if (oldName && newName) {
        title = `${oldName} -> ${newName}`
      } else if (oldName) {
        title = `${oldName} (deleted)`
      } else {
        title = `${newName} (created)`
      }
    } else {
      title = `${newName ?? oldName ?? ''}`
    }

    return setWindowTitle(title)
  }, [fileDiff?.newName, fileDiff?.oldName])

  return {
    loading,
    filePath: fileName,
    setFilePath,
    diff,
    left,
    right,
  }
}
