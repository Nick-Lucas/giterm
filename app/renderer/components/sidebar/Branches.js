import React, { useState, useCallback, useMemo } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'
import { Section } from './Section'
import { useSelector } from 'react-redux'
import _ from 'lodash'

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
  const _branches = useSelector((state) => state.branches) || []
  const branches = useMemo(
    () => {
      const foundRemotes = {}
      const branches = []

      for (const branch of _branches) {
        if (branch.upstream) {
          foundRemotes[branch.upstream.name] = true
        }

        if (!foundRemotes[branch.name]) {
          branches.push(branch)
        }
      }

      return branches
    },
    [_branches],
  )

  return (
    <Section>
      {branches.map((branch) => {
        return (
          <Row key={branch.id}>
            <Label>{branch.name}</Label>
            {branch.upstream && (
              <div>
                {branch.upstream.ahead > 0 && '>' + branch.upstream.ahead}
                {branch.upstream.behind > 0 && ' <' + branch.upstream.behind}
              </div>
            )}
          </Row>
        )
      })}
    </Section>
  )
}

const Row = styled.div`
  display: flex;
  flex-direction: row;
  padding: 0.25rem 0.5rem;

  :hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`

const Label = styled.div`
  flex: 1;
`
