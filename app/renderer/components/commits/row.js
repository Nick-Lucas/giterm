import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import * as props from './props'
import Tag from './tag'
import { PathLine } from '../graph/pathline'

const Colours = [
  '#058ED9',
  '#880044',
  '#875053',
  '#129490',
  '#E5A823',
  '#0055A2',
  '#96C5F7',
]

export const RowHeight = 25
const GraphColumnWidth = 20

const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;

  padding-right: 3px;
  padding-left: 3px;

  align-items: center;

  :hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  color: rgba(255, 255, 255, 0.8);
`
const selectedStyle = { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
const headStyle = { fontWeight: 'bold', color: 'rgba(255, 255, 255, 1)' }

const RowColumn = styled.div`
  display: flex;
  flex-direction: row;

  margin-right: 10px;
  max-height: 100%;

  overflow: hidden;
`

const ColumnText = styled.div`
  display: flex;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export default class Row extends React.Component {
  handleSelect = () => {
    const { commit, onSelect } = this.props
    onSelect(commit)
  }

  handleDoubleClick = () => {
    const { commit, onDoubleClick } = this.props
    onDoubleClick(commit)
  }

  getWrapperStyle() {
    const { height, selected, commit } = this.props

    return {
      height,
      ...(selected ? selectedStyle : {}),
      ...(commit.isHead ? headStyle : {}),
    }
  }

  render() {
    const { columns, commit } = this.props

    return (
      <RowWrapper
        style={this.getWrapperStyle()}
        onClick={this.handleSelect}
        onDoubleClick={this.handleDoubleClick}>
        {columns.map((column) => (
          <RowColumn key={column.key} style={{ width: column.width }}>
            {column.showTags && this.renderTags()}

            {column.key === 'graph' ? (
              this.renderGraphItem()
            ) : (
              <ColumnText>{commit[column.key]}</ColumnText>
            )}
          </RowColumn>
        ))}
      </RowWrapper>
    )
  }

  renderTags() {
    const {
      branches,
      showRemoteBranches,
      commit,
      currentBranchName,
    } = this.props
    return branches
      .filter(
        (branch) =>
          commit.sha === branch.headSHA &&
          (branch.isRemote ? showRemoteBranches : true),
      )
      .map((branch) => (
        <Tag
          key={branch.id}
          label={branch.name}
          current={branch.name === currentBranchName}
        />
      ))
  }

  renderGraphItem() {
    const { nodeRow, linksBefore, linksAfter } = this.props

    const nodeIndex = nodeRow.findIndex((node) => node.type === 'node')
    const node = nodeRow[nodeIndex]

    return (
      <svg>
        {linksBefore.map((link) => (
          <PathLine
            key={JSON.stringify(link)}
            points={this.getPathLinePoints(link)}
            stroke={Colours[link.colour % Colours.length]}
            strokeWidth={3}
            fill="none"
            r={2}
          />
        ))}
        {linksAfter.map((link) => (
          <PathLine
            key={JSON.stringify(link)}
            points={this.getPathLinePoints(link)}
            stroke={Colours[link.colour % Colours.length]}
            strokeWidth={3}
            fill="none"
            r={2}
          />
        ))}
        <circle
          key={node.sha}
          cx={10 + nodeIndex * GraphColumnWidth}
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
  }

  getPathLinePoints(link) {
    const x1 = link.x1 * GraphColumnWidth + 10
    const y1 = link.y1 - RowHeight / 2
    const x2 = link.x2 * GraphColumnWidth + 10
    const y2 = link.y2 - RowHeight / 2

    return [
      { x: x1, y: y1 },
      x1 < x2 ? { x: x2, y: y1 + 10 } : { x: x1, y: y2 - 10 },
      { x: x2, y: y2 },
    ]
  }
}

Row.propTypes = {
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  onDoubleClick: PropTypes.func,
  columns: props.columns,
  branches: props.branches,
  showRemoteBranches: PropTypes.bool.isRequired,
  commit: props.commit,
  nodeRow: PropTypes.array.isRequired,
  linksBefore: PropTypes.array.isRequired,
  linksAfter: PropTypes.array.isRequired,
  height: PropTypes.number.isRequired,
  currentBranchName: PropTypes.string,
}
