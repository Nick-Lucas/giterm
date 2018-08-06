import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { columns, item, branches } from './props'
import Tag from './tag'

const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;

  padding-left: 0.3em;
  padding-right: 0.3em;

  :hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  color: rgba(255, 255, 255, 0.8);
`
const selectedStyle = { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
const headStyle = { fontWeight: 'bold', color: 'rgba(255, 255, 255, 1)' }

const RowColumn = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 0.5em;
  padding-top: 0.3em;
  padding-bottom: 0.3em;
`

export default class Row extends React.Component {
  handleSelect = () => {
    const { item, onSelect } = this.props
    onSelect(item)
  }

  getWrapperStyle() {
    const { selected, item } = this.props

    return {
      ...(selected ? selectedStyle : {}),
      ...(item.isHead ? headStyle : {}),
    }
  }

  render() {
    const { columns, item, branches } = this.props
    return (
      <RowWrapper style={this.getWrapperStyle()} onClick={this.handleSelect}>
        {columns.map((column) => (
          <RowColumn key={column.key} style={{ width: column.width }}>
            {column.showTags && this.renderTags()}
            {item[column.key]}
          </RowColumn>
        ))}
      </RowWrapper>
    )
  }

  renderTags() {
    const { branches, item } = this.props
    return branches
      .filter((branch) => item.sha === branch.headSHA)
      .map((branch) => <Tag key={branch.id} label={branch.name} />)
  }
}

Row.propTypes = {
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  columns,
  branches,
  item,
}
