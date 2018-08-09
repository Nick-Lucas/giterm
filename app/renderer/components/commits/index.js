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
import Graph from '../graph'

const TableWrapper = styled.div`
  overflow: auto;
  display: flex;
  flex-direction: row;
`

const TableGraphCol = styled.div`
  padding-left: 3px;
  padding-right: 10px;
`
const TableMainCol = styled.div`
  flex: 1;
`

const RowHeight = 25

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
          <TableGraphCol style={{ width: columns[0].width }}>
            <Graph rowHeight={RowHeight} />
          </TableGraphCol>
          <TableMainCol>
            {commits.map((commit, i) => (
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
                  height={RowHeight}
                />
              </RightClickArea>
            ))}
          </TableMainCol>
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
  { name: '*', key: 'graph', width: '60px', skipRowRender: true },
  { name: 'SHA', key: 'sha7', width: '50px' },
  { name: 'Message', key: 'message', width: '500px', showTags: true },
  { name: 'Author', key: 'authorStr', width: '150px' },
  { name: 'Date', key: 'dateStr', width: '150px' },
]

export default connect(
  ({ commits, branches }) => ({ commits, branches, columns }),
  { checkoutCommit },
)(Commits)
