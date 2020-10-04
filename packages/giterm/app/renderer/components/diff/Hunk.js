import React from 'react'
import styled, { css } from 'styled-components'

import { colours } from 'app/lib/theme'

export const Hunk = ({ hunk, index }) => {
  const { newLines, newStart, oldLines, oldStart } = hunk

  const rowMinNo = Math.min(oldStart, newStart)
  const rowMaxNo = Math.max(oldStart + oldLines, newStart + newLines)
  const rowCount = rowMaxNo - rowMinNo + 1

  const hunkHeaderRow = 1
  const hunkStartRow = 2
  const hunkEndRow = rowCount + hunkStartRow

  function getColour(line) {
    const { contentOffset, newLineno, oldLineno } = line

    const isRemovedLine = newLineno < 0
    const isAddedLine = oldLineno < 0
    const isModifiedLine = !isRemovedLine && !isAddedLine && contentOffset >= 0

    let leftColour = colours.BACKGROUND.FOCUS
    if (isRemovedLine) leftColour = colours.BACKGROUND.NEGATIVE
    if (isModifiedLine) leftColour = colours.BACKGROUND.NEGATIVE

    let rightColour = colours.BACKGROUND.FOCUS
    if (isAddedLine) rightColour = colours.BACKGROUND.POSITIVE
    if (isModifiedLine) rightColour = colours.BACKGROUND.POSITIVE

    return {
      leftColour,
      rightColour,
    }
  }

  return (
    <HunkCellGrid row={index + 1}>
      <Cell row={hunkHeaderRow} col="1 / 3">
        Hunk {index + 1}
      </Cell>

      {/* Left Content */}
      <HunkContentColumn
        col="1"
        row={`${hunkStartRow} / ${hunkEndRow}`}
        divider>
        {hunk.linesLeft.map((line, lineI) => {
          const row = lineI + 1
          const { content, oldLineno } = line
          const { leftColour } = getColour(line)

          return (
            <React.Fragment key={`left_${row}`}>
              <LineNumberCell row={row} colour={leftColour}>
                {oldLineno}
              </LineNumberCell>

              <ContentCell row={row} colour={leftColour}>
                {content}
              </ContentCell>
            </React.Fragment>
          )
        })}
      </HunkContentColumn>

      {/* Right Content */}
      <HunkContentColumn col="2" row={`${hunkStartRow} / ${hunkEndRow}`}>
        {hunk.linesRight.map((line, lineI) => {
          const row = lineI + 1
          const { content, newLineno } = line
          const { rightColour } = getColour(line)

          return (
            <React.Fragment key={`right_${row}`}>
              <LineNumberCell row={row} colour={rightColour}>
                {newLineno}
              </LineNumberCell>

              <ContentCell row={row} colour={rightColour}>
                {content}
              </ContentCell>
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

  margin-top: 1rem;
  :first-child {
    margin-top: 0;
  }
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

  border-top: solid gray 1px;
  border-bottom: solid gray 1px;
  ${({ divider }) =>
    divider &&
    css`
      border-right: solid gray 1px;
    `}
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
