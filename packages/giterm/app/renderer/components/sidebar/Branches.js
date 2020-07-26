import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'

import RightClickArea from 'react-electron-contextmenu'
import { clipboard } from 'electron'
import { Cloud, GitBranch } from 'react-feather'

import { Section } from './Section'
import { Row, Label } from './Row'
import { BranchUpstreamState } from './BranchUpstreamState'

/*  A branch
    {
      name: '12-infinite-loading',
      isRemote: false,
      isHead: false,
      id: 'refs/heads/12-infinite-loading',
      headSHA: '6d6e137f1630e64ad5668232cc4d9ea497cd0e6a'
    },
*/

export function Branches() {
  const _branches = useSelector((state) => state.branches.list) || []
  const branches = useMemo(() => {
    const foundRemotes = {}
    const branches = []

    for (const branch of _branches) {
      if (branch.isRemote) {
        continue
      }

      if (branch.upstream) {
        foundRemotes[branch.upstream.name] = true
      }

      if (!foundRemotes[branch.name]) {
        branches.push({
          id: branch.id,
          name: branch.name,
          upstream: branch.upstream,
          isHead: branch.isHead,
          menuItems: [
            {
              label: `Copy "${branch.name}"`,
              click: () => clipboard.writeText(branch.name),
            },
          ],
        })
      }
    }

    return branches
  }, [_branches])

  return (
    <Section
      title="BRANCHES"
      icon={
        <>
          <GitBranch size={15} />
          <Cloud size={15} />
        </>
      }>
      {branches.map((branch) => {
        return (
          <RightClickArea key={branch.id} menuItems={branch.menuItems}>
            <Row active={branch.isHead}>
              <Label>{branch.name}</Label>

              {branch.upstream && (
                <BranchUpstreamState
                  ahead={branch.upstream.ahead}
                  behind={branch.upstream.behind}
                  selected={branch.isHead}
                />
              )}
            </Row>
          </RightClickArea>
        )
      })}
    </Section>
  )
}
