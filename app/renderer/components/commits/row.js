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

const RowColumn = styled.div``

export default class Row extends React.Component {
  render() {
    const { columns, item } = this.props
    return (
      <RowWrapper>
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
  columns,
  item,
}
