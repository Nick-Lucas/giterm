import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import RightClickArea from 'react-electron-contextmenu'
import { clipboard } from 'electron'
import styled from 'styled-components'

import * as props from './props'
import Header from './header'
import Row from './row'
import { checkoutCommit } from '../../store/commits'

const TableWrapper = styled.div`
  overflow: auto;
`

export class Commits extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedSHA: '',
    }
  }

  handleSelect = (commit) => {
    this.setState({ selectedSHA: commit.sha })
  }

  getMenuItems = (item) => [
    {
      label: 'Copy SHA',
      click: () => clipboard.writeText(item.sha),
    },
  ]

  render() {
    const { columns, commits, branches, checkoutCommit } = this.props
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
                onDoubleClick={checkoutCommit}
              />
            </RightClickArea>
          ))}
        </TableWrapper>
      </React.Fragment>
    )
  }
}

Commits.propTypes = {
  columns: props.columns,
  commits: props.commits,
  branches: props.branches,
}

const columns = [
  { name: 'SHA', key: 'sha7', width: '3.5em' },
  { name: 'Message', key: 'message', width: '40em', showTags: true },
  { name: 'Author', key: 'authorStr', width: '8em' },
  { name: 'Date', key: 'dateStr', width: '8em' },
]

export default connect(
  ({ commits, branches }) => ({ commits, branches, columns }),
  { checkoutCommit },
)(Commits)
