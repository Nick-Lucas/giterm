import React, { useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Git } from '@giterm/git'
import { useSelector } from 'react-redux'

import { Hunk } from './Hunk'
import { Files } from './Files'
import { List } from 'app/lib/primitives'

export function Diff({
  mode = 'index',
  shaNew = 'bc546e06e8b7e4b561b5b859acb97e0f809eaaaf',
  shaOld = '529bbb2e074ed0cdd5fba316546eeb54704e1d37',
}) {
  const contextLines = 5
  const cwd = useSelector((state) => state.config.cwd)

  const [filePath, setFilePath] = useState(null)

  const [loading, setLoading] = useState(true)
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    let cancelled = false

    async function fetch() {
      const git = new Git(cwd)

      const diff =
        mode === 'shas'
          ? await git.getDiffFromShas(shaNew, shaOld, {
              contextLines: contextLines,
            })
          : await git.getDiffFromIndex({ contextLines: contextLines })

      if (!cancelled) {
        setDiff(diff)
        setLoading(false)
      }
    }

    fetch()

    return () => {
      cancelled = true
    }
  }, [cwd, mode, shaNew, shaOld])

  const changeset = useMemo(() => {
    if (!diff) return null

    const patch = diff.patches.find(
      (patch) =>
        patch.oldFilePath === filePath || patch.newFilePath === filePath,
    )

    const changeset = { ...patch, selectedFilePath: filePath, hunks: [] }
    if (!patch) return changeset

    for (const hunk of patch.hunks) {
      const linesLeft = []
      const linesRight = []

      for (const line of hunk.lines) {
        const headIndex = Math.max(linesLeft.length, linesRight.length)
        const isLeft = line.oldLineno >= 0
        const isRight = line.newLineno >= 0

        // Where line has not changed at-all we fix the row to the same index in both columns
        if (isLeft && isRight && line.contentOffset < 0) {
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

      changeset.hunks.push({ ...hunk, linesLeft, linesRight })
    }

    return changeset
  }, [diff, filePath])

  if (loading) {
    return (
      <DiffContainer>
        <MessageText>Loading</MessageText>
      </DiffContainer>
    )
  }

  return (
    <Row>
      <Files
        patches={diff.patches}
        filePath={filePath}
        onChange={setFilePath}
      />

      <DiffContainer>
        <PatchName>
          {changeset.oldFilePath === changeset.newFilePath ? (
            <List.Label trimStart>
              {changeset.oldFilePath ?? changeset.selectedFilePath}
            </List.Label>
          ) : (
            <>
              <List.Label trimStart>{changeset.newFilePath}</List.Label>
              <PatchNameSeparator>{'->'}</PatchNameSeparator>
              <List.Label trimStart>{changeset.oldFilePath}</List.Label>
            </>
          )}
        </PatchName>

        <HunksContainer>
          {changeset.hunks.length === 0 && (
            <MessageText>Nothing to display!</MessageText>
          )}

          {changeset.hunks.map((hunk, i) => (
            <Hunk key={`hunk_${i}`} hunk={hunk} index={i} />
          ))}
        </HunksContainer>
      </DiffContainer>
    </Row>
  )
}

Diff.propTypes = {
  mode: PropTypes.oneOf(['shas', 'index']),
  shaNew: PropTypes.string,
  shaOld: PropTypes.string,
}

const Row = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  height: 100%;

  overflow: hidden;
`

const DiffContainer = styled.div`
  display: flex;
  flex-direction: column;

  overflow: auto;

  flex: 3 3 0;
`

const PatchName = styled.div`
  display: block;
  flex: 0 0 auto;

  flex-direction: row;
  align-items: center;
  justify-content: center;

  padding: 0 1rem;
`

const PatchNameSeparator = styled.div`
  padding: 0 0.5rem;
`

const HunksContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;

  margin-top: 1rem;
`

const MessageText = styled.div`
  text-align: center;
`
