import React, { memo, useMemo } from 'react'
import styled, { css } from 'styled-components'
import { Column } from './props'
import { GitRef } from './GitRef'
import { PathLine } from 'app/components/graph/pathline'
import { GraphColumnWidth, GraphIndent, RowHeight } from './constants'
import { colours } from 'app/lib/theme'
import _ from 'lodash'
import { Link, Node } from '@giterm/gitgraph'
import { BranchRef, Commit, TagRef } from '@giterm/git'
import { useSelector } from 'app/store'

const Colours = colours.GRAPH_NODES

const SelectedRowCSS = css`
  background-color: ${colours.OVERLAY.FOCUS};
`
const HeadRowCSS = css`
  font-weight: 'bold';
  color: ${colours.TEXT.FOCUS};
`

interface RowWrapperProps {
  isSelected: boolean
  isHead: boolean
}
const RowWrapper = styled.div<RowWrapperProps>`
  display: flex;
  flex-direction: row;

  height: ${RowHeight}px;
  padding-right: 3px;
  padding-left: 3px;

  align-items: center;

  :hover {
    background-color: ${colours.OVERLAY.HINT};
  }

  color: ${colours.TEXT.DEFAULT};

  ${({ isSelected }) => isSelected && SelectedRowCSS}
  ${({ isHead }) => isHead && HeadRowCSS}
`

interface RowColumnProps {
  alignVertical: boolean
  width: string
}
const RowColumn = styled.div<RowColumnProps>`
  display: flex;
  flex-direction: row;
  align-items: ${({ alignVertical }) => (alignVertical ? 'center' : 'initial')};

  margin-right: 10px;
  max-height: 100%;

  overflow: hidden;

  width: ${({ width }) => width};
`

const ColumnText = styled.div`
  display: flex;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

function getPathLinePoints(link: Link, indexOffset = 0) {
  const x1 = link.x1 * GraphColumnWidth + GraphIndent
  const y1 = -RowHeight / 2 + indexOffset * RowHeight
  const x2 = link.x2 * GraphColumnWidth + GraphIndent
  const y2 = RowHeight / 2 + indexOffset * RowHeight

  return [
    ...(link.nodeAtStart
      ? [{ x: x1, y: y1 }]
      : [
          { x: x1, y: y1 },
          { x: x1, y: y1 + 3 },
        ]),
    x1 < x2
      ? { x: x2, y: y1 + RowHeight / 2 }
      : { x: x1, y: y2 - RowHeight / 2 },
    ...(link.nodeAtEnd
      ? [{ x: x2, y: y2 }]
      : [
          { x: x2, y: y2 - 3 },
          { x: x2, y: y2 },
        ]),
  ]
}

interface Props {
  commit: Commit
  isHead: boolean
  node: Node
  linksBefore: Link[]
  linksAfter: Link[]
  selected: boolean
  columns: Column[]
  branchRefs: BranchRef[]
  tagRefs: TagRef[]
}

export const _Row = ({
  columns,
  commit,
  branchRefs,
  tagRefs,
  isHead,
  node,
  linksBefore,
  linksAfter,
  selected,
}: Props) => {
  const showRemoteBranches = useSelector(
    (state) => state.config.showRemoteBranches,
  )

  const [localBranchRefs, remoteBranchRefs] = useMemo(() => {
    return _.partition(
      branchRefs,
      (branchRefs) => !!branchRefs.local && branchRefs.sha === commit.sha,
    )
  }, [branchRefs, commit.sha])

  return (
    <RowWrapper
      data-testid={`commit-${commit.sha}`}
      isSelected={selected}
      isHead={isHead}>
      {columns.map((column) => (
        <RowColumn
          key={column.key}
          width={column.width}
          alignVertical={column.key !== 'graph'}>
          {column.showTags &&
            localBranchRefs.map((branch) => (
              <GitRef
                key={branch.local!.id}
                label={branch.local!.name}
                current={branch.isHead}
                remoteInSync={
                  showRemoteBranches && branch.upstream?.sha === branch.sha
                }
                type="branch"
                ahead={
                  branch.upstream && showRemoteBranches
                    ? branch.upstream.ahead
                    : 0
                }
                behind={
                  branch.upstream && showRemoteBranches
                    ? branch.upstream.behind
                    : 0
                }
              />
            ))}

          {column.showTags &&
            showRemoteBranches &&
            remoteBranchRefs.map((branch) => (
              <GitRef
                key={branch.upstream!.id}
                label={branch.upstream!.name}
                remoteInSync={branch.upstream?.sha === branch.sha}
                type="remote-branch"
              />
            ))}

          {column.showTags &&
            tagRefs.map((tag) => (
              <GitRef key={tag.id} label={tag.name} type="tag" />
            ))}

          {column.key === 'graph' ? (
            !!node && (
              <svg>
                {linksBefore.map((link) => (
                  <PathLine
                    key={JSON.stringify(link)}
                    points={getPathLinePoints(link, 0)}
                    stroke={Colours[link.colour % Colours.length]}
                    strokeWidth={3}
                    fill="none"
                    r={2}
                  />
                ))}
                {linksAfter.map((link) => (
                  <PathLine
                    key={JSON.stringify(link)}
                    points={getPathLinePoints(link, 1)}
                    stroke={Colours[link.colour % Colours.length]}
                    strokeWidth={3}
                    fill="none"
                    r={2}
                  />
                ))}
                <circle
                  key={node.sha}
                  cx={GraphIndent + node.column * GraphColumnWidth}
                  cy={RowHeight / 2}
                  r={5}
                  fill={
                    Colours[
                      (node.secondaryColour
                        ? node.secondaryColour
                        : node.primaryColour) % Colours.length
                    ]
                  }
                  strokeWidth={3}
                  stroke={Colours[node.primaryColour % Colours.length]}
                />
              </svg>
            )
          ) : (
            <ColumnText>
              {column.format
                ? column.format(commit[column.key])
                : commit[column.key]}
            </ColumnText>
          )}
        </RowColumn>
      ))}
    </RowWrapper>
  )
}

export const Row = memo(_Row)

Row.displayName = 'Row'
