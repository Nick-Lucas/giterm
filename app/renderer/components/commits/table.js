import React from 'react'
import PropTypes from 'prop-types'
import RightClickArea from 'react-electron-contextmenu'
import { clipboard } from 'electron'
import styled from 'styled-components'

import { columns, data, branches } from './props'
import Header from './header'
import Row from './row'

const TableWrapper = styled.div`
  overflow: auto;
`

export default class Table extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedSHA: '',
    }
  }

  handleSelect = (item) => {
    this.setState({ selectedSHA: item.sha })
  }

  getMenuItems = (item) => [
    {
      label: 'Copy SHA',
      click: () => clipboard.writeText(item.sha),
    },
  ]

  render() {
    const { columns, data, branches } = this.props
    const { selectedSHA } = this.state

    return (
      <React.Fragment>
        <Header columns={columns} />
        <TableWrapper>
          {data.map((row) => (
            <RightClickArea key={row.sha} menuItems={this.getMenuItems(row)}>
              <Row
                item={row}
                columns={columns}
                branches={branches}
                selected={selectedSHA === row.sha}
                onSelect={this.handleSelect}
              />
            </RightClickArea>
          ))}
        </TableWrapper>
      </React.Fragment>
    )
  }
}

Table.propTypes = {
  columns,
  data,
  branches,
}
