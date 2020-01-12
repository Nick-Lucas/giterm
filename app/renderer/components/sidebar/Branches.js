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
  const branches = useSelector((state) => state.branches) || []

  const groups = useMemo(
    () => {
      const groups = {}

      for (const branch of branches) {
        if (!groups[branch.simpleName]) {
          groups[branch.simpleName] = {
            key: branch.simpleName,
            label: branch.simpleName,
            localId: null,
            hasRemote: false,
            remoteId: null,
          }
        }

        const group = groups[branch.simpleName]
        if (branch.isRemote) {
          group.hasRemote = true
          group.remoteId = branch.id
        }
        if (!branch.isRemote) {
          group.localId = branch.id
        }
      }

      return Object.values(groups)
    },
    [branches],
  )

  return (
    <Section>
      {groups.map((branch) => {
        // if (branch.localId == null) {
        //   console.log(branch)
        //   return null
        // }

        return (
          <Row key={branch.key}>
            <div>{branch.label}</div>
          </Row>
        )
      })}
    </Section>
  )
}

const Row = styled.div`
  padding: 0.25rem 0.5rem;

  :hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`
