import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import RightClickArea from 'react-electron-contextmenu'
import { clipboard } from 'electron'
import styled from 'styled-components'
import { List, AutoSizer } from 'react-virtualized'
import debounce from 'debounce'

import * as props from './props'
import Header from './header'
import Row from './row'
import { checkoutCommit, loadMoreCommits } from '../../store/commits'

import { bindServices } from '../../lib/di'

const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`

const TableWrapper = styled.div`
  flex: 1;
`

export const RowHeight = 25

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

  considerLoadMoreItems = ({ clientHeight, scrollHeight, scrollTop }) => {
    const scrollBottom = scrollTop + clientHeight
    const remainingRows = Math.trunc((scrollHeight - scrollBottom) / RowHeight)
    if (remainingRows < 20) {
      this.loadMoreItems()
    }
  }

  loadMoreItems = debounce(
    () => this.props.loadMoreCommits(this.props.gitService),
    1000,
    true,
  )

  render() {
    const { columns, graphRows } = this.props

    return (
      <Wrapper>
        <Header columns={columns} />
        <TableWrapper>
          <AutoSizer>
            {({ width, height }) => (
              <List
                width={width}
                height={height}
                rowHeight={RowHeight}
                rowCount={graphRows.length}
                overscanRowCount={2}
                rowRenderer={this.renderRow}
                onScroll={this.considerLoadMoreItems}
              />
            )}
          </AutoSizer>
        </TableWrapper>
      </Wrapper>
    )
  }

  renderRow = ({ index, style }) => {
    const {
      columns,
      graphRows,
      branches,
      showRemoteBranches,
      checkoutCommit,
      gitService,
      status: { current: currentBranchName },
    } = this.props
    const { selectedSHA } = this.state

    const row = graphRows[index]
    const commit = row.node.commit
    return (
      <RightClickArea
        key={commit.sha}
        menuItems={this.getMenuItems(commit)}
        style={style}>
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
          graphItem={row}
        />
      </RightClickArea>
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
  ({
    commits: { commits = [] } = {},
    graph: graphRows = [],
    branches,
    status,
    config: { showRemoteBranches },
  }) => ({
    commits,
    graphRows,
    branches,
    showRemoteBranches,
    columns,
    status,
  }),
  (dispatch) => {
    return {
      checkoutCommit: (...args) => dispatch(checkoutCommit(...args)),
      loadMoreCommits: (...args) => dispatch(loadMoreCommits(...args)),
    }
  },
)(Commits)

export default bindServices(({ git }) => ({ gitService: git }))(
  ConnectedCommits,
)
