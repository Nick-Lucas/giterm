import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import * as props from './props'
import Tag from './tag'
import { PathLine } from '../graph/pathline'

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
    const {
      graphItem: { yOffset, node, links },
    } = this.props
    return (
      <svg>
        {links.map((link) => (
          <PathLine
            key={link.sourceSha + '__' + link.targetSha}
            points={this.getPathLinePoints(link, yOffset)}
            stroke={link.color}
            strokeWidth={3}
            fill="none"
            r={20}
          />
        ))}
        <circle
          key={node.commit.sha}
          cx={node.x}
          cy={node.y - yOffset}
          r={5}
          fill={node.secondColor ? node.secondColor : node.color}
          strokeWidth={3}
          stroke={node.color}
        />
      </svg>
    )
  }

  getPathLinePoints(link, yOffset) {
    const x1 = link.source.x
    const y1 = link.source.y - yOffset
    const x2 = link.target.x
    const y2 = link.target.y - yOffset
    return [
      { x: x1, y: y1 },
      x1 < x2 ? { x: x2, y: y1 } : { x: x1, y: y2 },
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
  height: PropTypes.number.isRequired,
  currentBranchName: PropTypes.string.isRequired,
}
