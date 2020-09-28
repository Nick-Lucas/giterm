import React, { useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Git } from '@giterm/git'
import { useSelector } from 'react-redux'

import { Hunk } from './Hunk'

// TODO: add a file selector to this view
export function Diff({
  mode = 'index',
  shaNew = 'bc546e06e8b7e4b561b5b859acb97e0f809eaaaf',
  shaOld = '529bbb2e074ed0cdd5fba316546eeb54704e1d37',
  filePath = 'packages/giterm/app/renderer/components/diff/Diff.js',
}) {
  const contextLines = 5
  const cwd = useSelector((state) => state.config.cwd)

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
    console.log(diff)
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
      <Container>
        <MessageText>Loading</MessageText>
      </Container>
    )
  }

  console.log({ changeset, diff })

  return (
    <Container>
      <PatchName>
        {changeset.oldFilePath === changeset.newFilePath ? (
          <PatchNameCell>
            {changeset.oldFilePath ?? changeset.selectedFilePath}
          </PatchNameCell>
        ) : (
          <>
            <PatchNameCell>{changeset.newFilePath}</PatchNameCell>
            <PatchNameSpeparator>{'->'}</PatchNameSpeparator>
            <PatchNameCell>{changeset.oldFilePath}</PatchNameCell>
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
    </Container>
  )
}

Diff.propTypes = {
  mode: PropTypes.oneOf(['shas', 'index']),
  shaNew: PropTypes.string,
  shaOld: PropTypes.string,
}

const Container = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;

  background-color: #001825;

  overflow: auto;

  padding: 0.25rem 0;
`

const PatchName = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  padding: 0 1rem;
`

const PatchNameSpeparator = styled.div`
  padding: 0 0.5rem;
`

const PatchNameCell = styled.div`
  flex: 1;

  color: ${({ colour }) => colour || 'inherit'};

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
  text-align: center;
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
