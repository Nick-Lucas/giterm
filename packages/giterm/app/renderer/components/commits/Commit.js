import React, { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { RightClickArea } from 'app/lib/primitives'
import { clipboard } from 'electron'

import { checkoutCommit } from 'app/store/commits/actions'
import { Row } from './Row'
import { RowHeight } from './constants'
import { REF_TYPE_BRANCH, REF_TYPE_REMOTE_BRANCH, REF_TYPE_TAG } from './props'

export function Commit({ index, style, onSelect, isSelected, columns }) {
  const dispatch = useDispatch()

  const branchesBySha = useSelector((state) => state.branches.bySha)
  const tagsBySha = useSelector((state) => state.tags.bySha)
  const { nodes, links } = useSelector((state) => state.graph)
  const commits = useSelector((state) => state.commits?.commits) ?? []
  const commit = commits[index]

  const status = useSelector((state) => state.status)
  const { showRemoteBranches } = useSelector((state) => state.config)

  const handleCheckoutCommit = useCallback(
    (commit) => {
      dispatch(checkoutCommit(commit.sha))
    },
    [dispatch],
  )

  const refsForCommit = useMemo(
    () => [
      ...(tagsBySha[commit.sha]?.map((tag) => ({
        ...tag,
        type: REF_TYPE_TAG,
      })) ?? []),
      ...(branchesBySha[commit.sha]
        ?.filter((branch) => {
          if (!showRemoteBranches) {
            return !branch.isRemote
          }
          return true
        })
        ?.map((branch) => ({
          ...branch,
          type: branch.isRemote ? REF_TYPE_REMOTE_BRANCH : REF_TYPE_BRANCH,
        })) ?? []),
    ],
    [branchesBySha, commit.sha, showRemoteBranches, tagsBySha],
  )

  const menuItems = useMemo(
    () => [
      {
        label: 'Copy SHA',
        click: () => clipboard.writeText(commit.sha),
      },
      ...refsForCommit.map((branch) => ({
        label: `Copy "${branch.name}"`,
        click: () => clipboard.writeText(branch.name),
      })),
    ],
    [refsForCommit, commit.sha],
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
        refs={refsForCommit}
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
