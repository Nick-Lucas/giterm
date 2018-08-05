import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { columns, item } from './props'

const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;

  padding: 0.3em;

  :hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`
const selectedStyle = { backgroundColor: 'rgba(255, 255, 255, 0.3)' }

const RowColumn = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 0.5em;
`

export default class Row extends React.Component {
  handleSelect = () => {
    const { item, onSelect } = this.props
    onSelect(item)
  }

  render() {
    const { selected, columns, item } = this.props
    return (
      <RowWrapper
        style={selected ? selectedStyle : {}}
        onClick={this.handleSelect}>
        {columns.map((column) => (
          <RowColumn key={column.key} style={{ width: column.width }}>
            {item[column.key]}
          </RowColumn>
        ))}
      </RowWrapper>
    )
  }
}

Row.propTypes = {
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  columns,
  item,
}
