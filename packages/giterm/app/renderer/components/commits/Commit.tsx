import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'app/store'
import { RightClickArea } from 'app/lib/primitives'
import { clipboard } from 'electron'

import { Row } from './Row'
import { Column } from './props'

interface Props {
  index: number
  style: React.CSSProperties
  onClick: (e: React.MouseEventHandler<HTMLDivElement>, commit: any) => void
  isSelected: boolean
  columns: Column[]
}

const EMPTY: any[] = []

export function Commit({ index, style, onClick, isSelected, columns }: Props) {
  const branchesBySha = useSelector((state) => state.branches.bySha)
  const tagsBySha = useSelector((state) => state.tags.bySha)
  const { nodes, links } = useSelector((state) => state.graph)
  const commits = useSelector((state) => state.commits.commits)
  const commit = commits[index]

  const status = useSelector((state) => state.status)

  const handleClick = useCallback(
    (e) => {
      onClick(e, commit)
    },
    [commit, onClick],
  )

  const branches = branchesBySha[commit.sha] ?? EMPTY
  const tags = tagsBySha[commit.sha] ?? EMPTY

  const menuItems = useMemo(
    () => [
      {
        label: 'Copy SHA',
        click: () => clipboard.writeText(commit.sha),
      },
      ...branches.flatMap((branch) =>
        [branch.local?.name, branch.upstream?.name]
          .filter(Boolean)
          .map((name) => {
            return {
              label: `Copy "${name}"`,
              click: () => clipboard.writeText(name!),
            }
          }),
      ),
      ...tags.map((tag) => ({
        label: `Copy "${tag.name}"`,
        click: () => clipboard.writeText(tag.name),
      })),
    ],
    [branches, commit.sha, tags],
  )

  if (commits.length !== nodes.length) {
    return null
  }

  const node = nodes[index]
  const linksBefore = links[index] || []
  const linksAfter = links[index + 1] || []

  return (
    <RightClickArea
      key={commit.sha}
      menuItems={menuItems}
      style={style}
      onClick={handleClick}>
      <Row
        commit={commit}
        columns={columns}
        branchRefs={branches}
        tagRefs={tags}
        selected={isSelected}
        isHead={status.headSHA === commit.sha}
        node={node}
        linksBefore={linksBefore}
        linksAfter={linksAfter}
      />
    </RightClickArea>
  )
}
