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
import { bindServices } from '../../lib/di'
import { SubwayCalculator } from '../graph/subway-calculator'

const Wrapper = styled.div`
  flex: 1;
  flex-direction: column;
`

const TableWrapper = styled.div`
  overflow: auto;
  flex: 1;
  display: block;
  position: relative;
`

const TableGraphCol = styled.div`
  padding-left: 3px;
  padding-right: 10px;
  position: absolute;
  top: 0;
  z-index: -1;
`
const TableMainCol = styled.div`
  display: block;
`

const RowHeight = 25

export class Commits extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedSHA: '',
    }

    this.calculator = new SubwayCalculator(RowHeight)
    this.calculator.getSubwayMap(props.commits)
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
    const {
      columns,
      commits,
      branches,
      showRemoteBranches,
      checkoutCommit,
      gitService,
      status: { current: currentBranchName },
    } = this.props
    const { selectedSHA } = this.state

    this.calculator.updateCommits(commits)

    return (
      <Wrapper>
        <Header columns={columns} />
        <TableWrapper>
          {/* <TableGraphCol
            style={{
              height: RowHeight * commits.length,
              width: columns[0].width,
            }}>
            <Graph rowHeight={RowHeight} />
          </TableGraphCol> */}
          <TableMainCol>
            {commits.map((commit, i) => (
              <RightClickArea
                key={commit.sha}
                menuItems={this.getMenuItems(commit)}>
                <Row
                  commit={commit}
                  columns={columns}
                  branches={branches}
                  showRemoteBranches={showRemoteBranches}
                  selected={selectedSHA === commit.sha}
                  onSelect={this.handleSelect}
                  onDoubleClick={(commit) => checkoutCommit(gitService, commit)}
                  height={RowHeight}
                  currentBranchName={currentBranchName}
                  graphItem={this.calculator.rows[i]}
                />
              </RightClickArea>
            ))}
          </TableMainCol>
        </TableWrapper>
      </Wrapper>
    )
  }
}

Commits.propTypes = {
  columns: props.columns,
  commits: props.commits,
  branches: props.branches,
  showRemoteBranches: PropTypes.bool.isRequired,
}

const columns = [
  { name: '', key: 'graph', width: '100px' },
  { name: 'SHA', key: 'sha7', width: '50px' },
  { name: 'Message', key: 'message', width: '500px', showTags: true },
  { name: 'Author', key: 'authorStr', width: '150px' },
  { name: 'Date', key: 'dateStr', width: '150px' },
]

const ConnectedCommits = connect(
  ({ commits, branches, status, config: { showRemoteBranches } }) => ({
    commits,
    branches,
    showRemoteBranches,
    columns,
    status,
  }),
  { checkoutCommit },
)(Commits)

export default bindServices(({ git }) => ({ gitService: git }))(
  ConnectedCommits,
)
