import React, { PureComponent } from 'react'

import * as props from './props'

import styled from 'styled-components'

const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: row;

  padding: 3px;
  padding-bottom: 5px;
`

const HeaderColumn = styled.div`
  display: flex;
  padding-right: 10px;
`

export default class Header extends PureComponent {
  render() {
    const { columns } = this.props

    return (
      <HeaderWrapper>
        {columns.map((column) => (
          <HeaderColumn key={column.key} style={{ width: column.width }}>
            {column.name}
          </HeaderColumn>
        ))}
      </HeaderWrapper>
    )
  }
}

Header.propTypes = {
  columns: props.columns,
}
