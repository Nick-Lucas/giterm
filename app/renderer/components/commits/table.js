import React from 'react'
import PropTypes from 'prop-types'
import RightClickArea from 'react-electron-contextmenu'
import { clipboard } from 'electron'
import styled from 'styled-components'

import * as props from './props'
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
    const { columns, commits, branches } = this.props
    const { selectedSHA } = this.state

    return (
      <React.Fragment>
        <Header columns={columns} />
        <TableWrapper>
          {commits.map((commit) => (
            <RightClickArea
              key={commit.sha}
              menuItems={this.getMenuItems(commit)}>
              <Row
                commit={commit}
                columns={columns}
                branches={branches}
                selected={selectedSHA === commit.sha}
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
  columns: props.columns,
  commits: props.commits,
  branches: props.branches,
}
