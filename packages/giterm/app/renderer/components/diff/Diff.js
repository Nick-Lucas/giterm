import React, { useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import NodeGit from 'nodegit'

import { data } from './data'

function unwrap(objectWithFunctions) {
  return Object.keys(objectWithFunctions).reduce((obj, key) => {
    obj[key] =
      typeof objectWithFunctions[key] === 'function'
        ? objectWithFunctions[key]()
        : objectWithFunctions[key]
    return obj
  }, {})
}

export function Diff() {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    async function fetch() {
      const repo = await NodeGit.Repository.open('/Users/nick/dev/giterm/')

      const sha1 = '529bbb2e074ed0cdd5fba316546eeb54704e1d37'
      const sha2 = 'bc546e06e8b7e4b561b5b859acb97e0f809eaaaf'

      // FULL COMMIT TO COMMIT DIFF
      const c1 = await (await repo.getCommit(sha1)).getTree()
      const c2 = await (await repo.getCommit(sha2)).getTree()

      const diff = await NodeGit.Diff.treeToTree(repo, c1, c2)

      const patches = await diff.patches()

      const dp = await Promise.all(
        patches.map(async (patch) => {
          const oldFilePath = patch.oldFile().path()
          const newFilePath = patch.newFile().path()
          const status = patch.status()

          return {
            hunks: await Promise.all(
              (await patch.hunks()).map(async (hunk) => {
                return {
                  header: hunk.header(),
                  headerLen: hunk.headerLen(),
                  newLines: hunk.newLines(),
                  newStart: hunk.newStart(),
                  oldLines: hunk.oldLines(),
                  oldStart: hunk.oldStart(),
                  size: hunk.size(),
                  lines: (await hunk.lines()).map((line) => {
                    return {
                      content: line.content(),
                      contentLen: line.contentLen(),
                      contentOffset: line.contentOffset(),
                      newLineno: line.newLineno(),
                      numLines: line.numLines(),
                      oldLineno: line.oldLineno(),
                      origin: line.origin(),
                      rawContent: line.rawContent(),
                    }
                  }),
                }
              }),
            ),
            status,
            oldFilePath,
            newFilePath,
          }
        }),
      )

      // Later we new NodeGit.DiffLine in order to stage/unstage
      // repo.stageFilemode
      // repo.stageLines

      setDiff(dp)
    }

    fetch()
  })

  const patchIndex = 3 // Commits.js
  const changeset = useMemo(() => {
    if (!diff) return null

    return diff[patchIndex]
  }, [diff])

  if (!changeset) {
    return <Container>Loading</Container>
  }

  return (
    <Container>
      <div>
        {changeset.oldFilePath === changeset.newFilePath
          ? changeset.oldFilePath
          : `${changeset.oldFilePath} -> ${changeset.newFilePath}`}
      </div>

      <HunksGrid>
        {changeset.hunks.map((hunk, i) => {
          const {
            header,
            headerLen,
            newLines,
            newStart,
            oldLines,
            oldStart,
            size,
          } = hunk

          const rowModifier = Math.min(oldStart, newStart)
          const rowCount =
            Math.max(oldStart + oldLines, newStart + newLines) - rowModifier

          return (
            <HunkCellGrid key={`hunk_${i}`} row={i}>
              <Cell row="1" col="1 / 5" colour="blue">
                hunk_{i}
              </Cell>

              {hunk.lines.map((line) => {
                const {
                  content,
                  contentLen,
                  contentOffset,
                  newLineno,
                  numLines,
                  oldLineno,
                  origin,
                  rawContent,
                } = line

                const isRemovedLine = newLineno < 0
                const isAddedLine = oldLineno < 0
                const isModifiedLine =
                  !isRemovedLine && !isAddedLine && contentOffset >= 0
                const isContextLine =
                  !isModifiedLine && !isRemovedLine && !isAddedLine

                const showLeft = !isAddedLine
                const showRight = !isRemovedLine

                let leftColour = 'transparent'
                if (isRemovedLine) leftColour = '#A60053'
                if (isModifiedLine) leftColour = '#149490'

                let rightColour = 'transparent'
                if (isAddedLine) rightColour = '#149490'
                if (isModifiedLine) rightColour = '#149490'

                return (
                  <React.Fragment key={`${oldLineno}->${newLineno}`}>
                    {showLeft && (
                      <>
                        <LineNumberCell
                          row={oldLineno - rowModifier + 2}
                          old
                          colour={leftColour}>
                          {oldLineno}
                        </LineNumberCell>

                        <ContentCell
                          row={oldLineno - rowModifier + 2}
                          col="2"
                          colour={leftColour}>
                          {content}
                        </ContentCell>
                      </>
                    )}

                    {showRight && (
                      <>
                        <LineNumberCell
                          row={newLineno - rowModifier + 2}
                          new
                          colour={rightColour}>
                          {newLineno}
                        </LineNumberCell>

                        <ContentCell
                          row={newLineno - rowModifier + 2}
                          col="4"
                          colour={rightColour}>
                          {content}
                        </ContentCell>
                      </>
                    )}
                  </React.Fragment>
                )
              })}
            </HunkCellGrid>
          )
        })}
      </HunksGrid>
    </Container>
  )
}

const Container = styled.div`
  position: absolute;
  top: 5%;
  bottom: 5%;
  right: 5%;
  left: 5%;

  background-color: black;

  overflow: auto;

  padding: 1rem 0.5rem;
`

const HunksGrid = styled.div`
  display: grid;

  grid-auto-columns: 1fr;
`

const HunkCellGrid = styled.div`
  display: grid;

  /* LinNo Content LineNo Content */
  grid-auto-columns: min-content 1fr min-content 1fr;

  /* Position in higher grid */
  grid-column: 1;
  grid-row: ${({ row }) => row};
`

const Cell = styled.div`
  grid-column: ${({ col }) => col};
  grid-row: ${({ row }) => row};

  background-color: ${({ colour = 'transparent' }) => colour};

  padding: 0.25rem;

  white-space: pre;

  overflow: scroll;
`

const LineNumberCell = styled(Cell).attrs((props) => ({
  col: props.new ? '3' : '1',
}))``
const ContentCell = styled(Cell)``
