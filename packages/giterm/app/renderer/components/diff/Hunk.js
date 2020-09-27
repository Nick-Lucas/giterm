import React from 'react'
import styled from 'styled-components'

export const Hunk = ({ hunk, index }) => {
  const { newLines, newStart, oldLines, oldStart } = hunk

  const rowMinNo = Math.min(oldStart, newStart)
  const rowMaxNo = Math.max(oldStart + oldLines, newStart + newLines)
  const rowCount = rowMaxNo - rowMinNo + 1

  const hunkHeaderRow = 1
  const hunkStartRow = 2
  const hunkEndRow = rowCount + hunkStartRow
  console.log({ index, rowMinNo })
  const lineNormaliser = rowMinNo - 1

  const linesContextLeft = hunk.linesLeft.map((line) => {
    const { contentOffset, newLineno, oldLineno } = line

    const isRemovedLine = newLineno < 0
    const isAddedLine = oldLineno < 0
    const isModifiedLine = !isRemovedLine && !isAddedLine && contentOffset >= 0
    const isContextLine = !isModifiedLine && !isRemovedLine && !isAddedLine

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
  const linesContextRight = hunk.linesRight.map((line) => {
    const { contentOffset, newLineno, oldLineno } = line

    const isRemovedLine = newLineno < 0
    const isAddedLine = oldLineno < 0
    const isModifiedLine = !isRemovedLine && !isAddedLine && contentOffset >= 0
    const isContextLine = !isModifiedLine && !isRemovedLine && !isAddedLine

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
    <HunkCellGrid row={index + 1}>
      <Cell row={hunkHeaderRow} col="1 / 3" colour="blue">
        Hunk {index + 1}
      </Cell>

      {/* Left Content */}
      <HunkContentColumn col="1" row={`${hunkStartRow} / ${hunkEndRow}`}>
        {hunk.linesLeft.map((line, lineI) => {
          const {
            content,
            newLineno,
            oldLineno,
          } = line
          const { showLeft, leftColour } = linesContextLeft[lineI]

          const row = lineI + 1
          
          return (
            <React.Fragment key={`left_${row}`}>
              {showLeft && (
                <>
                  <LineNumberCell
                    row={row}
                    colour={leftColour}>
                    {oldLineno}
                  </LineNumberCell>

                  <ContentCell
                    row={row}
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
      <HunkContentColumn col="2" row={`${hunkStartRow} / ${hunkEndRow}`}>
        {hunk.linesRight.map((line, lineI) => {
          const { content, newLineno, oldLineno } = line
          const { showRight, rightColour } = linesContextRight[lineI]

          const row = lineI + 1

          return (
            <React.Fragment key={`right_${row}`}>
              {showRight && (
                <>
                  <LineNumberCell
                    row={row}
                    colour={rightColour}>
                    {newLineno}
                  </LineNumberCell>

                  <ContentCell
                    row={row}
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
}

const HunkCellGrid = styled.div.attrs((props) => ({
  style: {
    gridRow: props.row,
  },
}))`
  display: grid;

  grid-auto-columns: 1fr 1fr;

  grid-column: 1;

  margin-top: 0.5rem;
`

const HunkContentColumn = styled.div.attrs((props) => ({
  style: {
    gridRow: props.row,
  },
}))`
  display: grid;
  grid-auto-columns: min-content 1fr;
  grid-auto-rows: 1.5rem;

  grid-column: ${({ col }) => col};

  overflow: scroll;
`

const Cell = styled.div.attrs((props) => ({
  style: {
    gridRow: props.row,
  },
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
