import React, { useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import NodeGit from 'nodegit'

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

      const _patches = await diff.patches()

      const patches = await Promise.all(
        _patches.map(async (patch) => {
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

      setDiff(patches)
    }

    fetch()
  }, [])

  const patchIndex = 3 // Commits.js
  const changeset = useMemo(() => {
    if (!diff) return null

    return diff[patchIndex]
  }, [diff])

  if (!changeset) {
    return <Container>Loading</Container>
  }

  console.log(changeset)

  return (
    <Container>
      <PatchName>
        {changeset.oldFilePath === changeset.newFilePath ? (
          <PatchNameCell>{changeset.oldFilePath}</PatchNameCell>
        ) : (
          <>
            <PatchNameCell>{changeset.newFilePath}</PatchNameCell>
            <PatchNameSpeparator>{'->'}</PatchNameSpeparator>
            <PatchNameCell>{changeset.oldFilePath}</PatchNameCell>
          </>
        )}
      </PatchName>

      <HunksGrid>
        {changeset.hunks.map((hunk, i) => {
          const { newLines, newStart, oldLines, oldStart } = hunk

          const rowMinNo = Math.min(oldStart, newStart)
          const rowMaxNo = Math.max(oldStart + oldLines, newStart + newLines)
          const rowCount = rowMaxNo - rowMinNo + 1

          const hunkHeaderRow = 1
          const hunkStartRow = 2
          const hunkEndRow = rowCount + hunkStartRow

          const lineNormaliser = rowMinNo - 1

          const linesContext = hunk.lines.map((line) => {
            const { contentOffset, newLineno, oldLineno } = line

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

            return {
              isRemovedLine,
              isAddedLine,
              isModifiedLine,
              isContextLine,
              showLeft,
              showRight,
              leftColour,
              rightColour,
            }
          })

          return (
            <HunkCellGrid key={`hunk_${i}`} row={i + 1}>
              <Cell row={hunkHeaderRow} col="1 / 3" colour="blue">
                Hunk {i + 1}
              </Cell>

              {/* Left Content */}
              <HunkContentColumn
                col="1"
                row={`${hunkStartRow} / ${hunkEndRow}`}>
                {hunk.lines.map((line, lineI) => {
                  const { content, newLineno, oldLineno } = line
                  const { showLeft, leftColour } = linesContext[lineI]

                  return (
                    <React.Fragment key={`left_${oldLineno}->${newLineno}`}>
                      {showLeft && (
                        <>
                          <LineNumberCell
                            row={oldLineno - lineNormaliser}
                            colour={leftColour}>
                            {oldLineno}
                          </LineNumberCell>

                          <ContentCell
                            row={oldLineno - lineNormaliser}
                            colour={leftColour}>
                            {content}
                          </ContentCell>
                        </>
                      )}
                    </React.Fragment>
                  )
                })}
              </HunkContentColumn>

              {/* Right Content */}
              <HunkContentColumn
                col="2"
                row={`${hunkStartRow} / ${hunkEndRow}`}>
                {hunk.lines.map((line, lineI) => {
                  const { content, newLineno, oldLineno } = line
                  const { showRight, rightColour } = linesContext[lineI]

                  return (
                    <React.Fragment key={`right_${oldLineno}->${newLineno}`}>
                      {showRight && (
                        <>
                          <LineNumberCell
                            row={newLineno - lineNormaliser}
                            colour={rightColour}>
                            {newLineno}
                          </LineNumberCell>

                          <ContentCell
                            row={newLineno - lineNormaliser}
                            colour={rightColour}>
                            {content}
                          </ContentCell>
                        </>
                      )}
                    </React.Fragment>
                  )
                })}
              </HunkContentColumn>
            </HunkCellGrid>
          )
        })}
      </HunksGrid>
    </Container>
  )
}

const Container = styled.div`
  position: absolute;
  top: 3%;
  bottom: 3%;
  right: 3%;
  left: 3%;

  background-color: #001825;

  overflow: auto;

  z-index: 1000;

  box-shadow: 2px 2px 15px 0px rgb(255, 255, 255, 0.3);
  border-radius: 5px;
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

const HunksGrid = styled.div`
  display: grid;

  grid-auto-columns: 1fr;
`

const HunkCellGrid = styled.div.attrs((props) => ({
  gridRow: props.row,
}))`
  display: grid;

  grid-auto-columns: 1fr 1fr;

  grid-column: 1;

  margin-top: 0.5rem;
`

const HunkContentColumn = styled.div.attrs((props) => ({
  gridRow: props.row,
}))`
  display: grid;
  grid-auto-columns: min-content 1fr;
  grid-auto-rows: 1.5rem;

  grid-column: ${({ col }) => col};

  overflow: scroll;
`

const Cell = styled.div.attrs((props) => ({
  gridRow: props.row,
}))`
  grid-column: ${({ col }) => col};

  background-color: ${({ colour = 'transparent' }) => colour};

  padding: 0.25rem;

  white-space: pre;
`

const LineNumberCell = styled(Cell)`
  grid-column: 1;
`
const ContentCell = styled(Cell)`
  grid-column: 2;
`
