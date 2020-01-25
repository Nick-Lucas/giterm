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
import { checkoutCommit, reachedEndOfList } from '../../store/commits/actions'
import { GraphColumnWidth, GraphIndent, RowHeight } from './constants'

export class Commits extends React.Component {
  constructor(props) {
    super(props)
    this.list = React.createRef()
    this.state = {
      selectedSHA: '',
      columns: [],
    }
  }

  static getDerivedStateFromProps(props, state) {
    const { nodes } = props

    const graphCols = Math.min(
      8,
      nodes.reduce((max, node) => Math.max(node.column + 1, max), 3),
    )

    return {
      ...state,
      columns: [
        {
          name: '',
          key: 'graph',
          width: `${GraphIndent + GraphColumnWidth * graphCols}px`,
        },
        { name: 'SHA', key: 'sha7', width: '50px' },
        { name: 'Message', key: 'message', width: '500px', showTags: true },
        { name: 'Author', key: 'authorStr', width: '150px' },
        { name: 'Date', key: 'dateStr', width: '150px' },
      ],
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
    const { commits } = this.props
    if (commits.length === 0) {
      return
    }

    const scrollBottom = scrollTop + clientHeight
    const remainingRows = Math.trunc((scrollHeight - scrollBottom) / RowHeight)
    if (remainingRows < 20) {
      this.loadMoreItems()
    }
  }

  loadMoreItems = debounce(() => this.props.reachedEndOfList(), 1000, true)

  scrollToSha = (sha) => {
    const index = this.props.commits.findIndex((c) => c.sha === sha)
    if (index >= 0) {
      this.setState({ selectedSHA: sha }, () =>
        this.list.current.scrollToRow(index),
      )
    }
  }

  componentDidUpdate(prevProps) {
    this.list.current.forceUpdateGrid()

    if (this.props.status.headSHA !== prevProps.status.headSHA) {
      this.scrollToSha(this.props.status.headSHA)
    }
  }

  render() {
    const { commits } = this.props
    const { columns } = this.state

    return (
      <Wrapper>
        <Header columns={columns} />
        <TableWrapper>
          <AutoSizer>
            {({ width, height }) => (
              <VirtualList
                ref={this.list}
                width={width}
                height={height}
                rowHeight={RowHeight}
                rowCount={commits.length}
                overscanRowCount={50}
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
      commits,
      nodes,
      links,
      branches,
      showRemoteBranches,
      checkoutCommit,
      status: { current: currentBranchName, headSHA },
    } = this.props
    const { columns } = this.state
    const { selectedSHA } = this.state

    if (commits.length !== nodes.length) {
      return
    }

    const node = nodes[index]
    const linksBefore = links[index] || []
    const linksAfter = links[index + 1] || []
    const commit = commits[index]
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
          onDoubleClick={(commit) => checkoutCommit(commit.sha)}
          isHead={headSHA === commit.sha}
          height={RowHeight}
          currentBranchName={currentBranchName}
          node={node}
          linksBefore={linksBefore}
          linksAfter={linksAfter}
        />
      </RightClickArea>
    )
  }
}

Commits.propTypes = {
  commits: props.commits,
  branches: props.branches,
  showRemoteBranches: PropTypes.bool.isRequired,
}

const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`

const TableWrapper = styled.div`
  flex: 1;
`

const VirtualList = styled(List)`
  outline: none;
`

export default connect(
  ({
    commits: { commits = [] } = {},
    graph: { nodes, links },
    branches,
    status,
    config: { showRemoteBranches },
  }) => ({
    commits,
    nodes,
    links,
    branches,
    showRemoteBranches,
    status,
  }),
  // TODO: not sure why but the condensed form isn't working here...
  (dispatch) => {
    return {
      checkoutCommit: (...args) => dispatch(checkoutCommit(...args)),
      reachedEndOfList: () => dispatch(reachedEndOfList()),
    }
  },
)(Commits)
