import React, { PureComponent } from 'react'

import { columns } from './props'

import styled from 'styled-components'

const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: row;

  padding: 0.3em;
  padding-bottom: 0.5em;
`

const HeaderColumn = styled.div`
  padding-right: 0.5em;
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
  columns,
}
