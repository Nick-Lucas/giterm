import React, { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import RightClickArea from 'react-electron-contextmenu'
import { clipboard } from 'electron'

import { Row } from './Row'
import { checkoutCommit } from '../../store/commits/actions'
import { GraphColumnWidth, GraphIndent, RowHeight } from './constants'

export function Commit({ index, style, onSelect, isSelected }) {
  const dispatch = useDispatch()
  const commits = useSelector((state) => state.commits?.commits) ?? []
  const commit = commits[index] // TODO: is this not passed in directly?
  const { nodes, links } = useSelector((state) => state.graph)
  const branches = useSelector((state) => state.branches)
  const status = useSelector((state) => state.status)
  const { showRemoteBranches } = useSelector((state) => state.config)

  const columns = useMemo(() => {
    const graphCols = Math.min(
      8,
      nodes.reduce((max, node) => Math.max(node.column + 1, max), 3),
    )

    return [
      {
        name: '',
        key: 'graph',
        width: `${GraphIndent + GraphColumnWidth * graphCols}px`,
      },
      { name: 'SHA', key: 'sha7', width: '50px' },
      { name: 'Message', key: 'message', width: '500px', showTags: true },
      { name: 'Author', key: 'authorStr', width: '150px' },
      { name: 'Date', key: 'dateStr', width: '150px' },
    ]
  }, [nodes])

  const handleCheckoutCommit = useCallback(
    (commit) => {
      dispatch(checkoutCommit(commit.sha))
    },
    [dispatch],
  )

  // TODO: this is very inefficient, build a branchesBySha lookup in redux instead
  const branchesForCommit = useMemo(
    () =>
      branches.filter(
        (branch) =>
          commit.sha === branch.headSHA &&
          (showRemoteBranches ? true : !branch.isRemote),
      ),
    [branches, commit.sha, showRemoteBranches],
  )

  const menuItems = useMemo(
    () => [
      {
        label: 'Copy SHA',
        click: () => clipboard.writeText(commit.sha),
      },
      ...branchesForCommit.map((branch) => ({
        label: `Copy "${branch.name}"`,
        click: () => clipboard.writeText(branch.name),
      })),
    ],
    [branchesForCommit, commit.sha],
  )

  if (commits.length !== nodes.length) {
    return null
  }

  const node = nodes[index]
  const linksBefore = links[index] || []
  const linksAfter = links[index + 1] || []

  return (
    <RightClickArea key={commit.sha} menuItems={menuItems} style={style}>
      <Row
        commit={commit}
        columns={columns}
        branches={branchesForCommit}
        selected={isSelected}
        onSelect={onSelect}
        onDoubleClick={handleCheckoutCommit}
        isHead={status.headSHA === commit.sha}
        height={RowHeight}
        node={node}
        linksBefore={linksBefore}
        linksAfter={linksAfter}
      />
    </RightClickArea>
  )
}

Commit.propTypes = {
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
}
