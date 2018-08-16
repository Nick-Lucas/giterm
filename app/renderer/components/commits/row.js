import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import * as props from './props'
import Tag from './tag'

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

  padding-right: 10px;
`

const ColumnText = styled.div`
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
            <ColumnText>{commit[column.key]}</ColumnText>
          </RowColumn>
        ))}
      </RowWrapper>
    )
  }

  renderTags() {
    const { branches, commit, currentBranchName } = this.props
    return branches
      .filter((branch) => commit.sha === branch.headSHA)
      .map((branch) => (
        <Tag
          key={branch.id}
          label={branch.name}
          current={branch.name === currentBranchName}
        />
      ))
  }
}

Row.propTypes = {
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  onDoubleClick: PropTypes.func,
  columns: props.columns,
  branches: props.branches,
  commit: props.commit,
  height: PropTypes.number.isRequired,
  currentBranchName: PropTypes.string.isRequired,
}
