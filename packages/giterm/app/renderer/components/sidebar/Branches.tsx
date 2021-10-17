import React, { useMemo } from 'react'
import { useSelector } from 'app/store'

import { clipboard } from 'electron'
import { Cloud, GitBranch } from 'react-feather'

import { RightClickArea, List } from 'app/lib/primitives'
import { Section } from './Section'
import { BranchUpstreamState } from './BranchUpstreamState'

export function Branches() {
  const _branches = useSelector((state) => state.branches.list)

  const branches = useMemo(
    () => _branches.filter((b) => !!b.local),
    [_branches],
  )
  const menuItems = useMemo(() => {
    return branches
      .filter((b) => !!b.local)
      .map((branch) => {
        const name = branch.local!.name
        return [
          {
            label: `Copy "${name}"`,
            click: () => clipboard.writeText(name),
          },
        ]
      })
  }, [branches])

  return (
    <Section
      title="BRANCHES"
      icon={
        <>
          <GitBranch size={15} />
          <Cloud size={15} />
        </>
      }>
      {branches.map((branch, index) => {
        return (
          <RightClickArea key={branch.local!.id} menuItems={menuItems[index]}>
            <List.Row active={branch.isHead}>
              <List.Label>{branch.local!.name}</List.Label>

              {(branch.isHead || branch.upstream) && (
                <BranchUpstreamState
                  ahead={branch.upstream?.ahead}
                  behind={branch.upstream?.behind}
                  selected={branch.isHead}
                />
              )}
            </List.Row>
          </RightClickArea>
        )
      })}
    </Section>
  )
}
