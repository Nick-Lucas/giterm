import React from 'react'
import { ArrowUp, ArrowDown, Cloud } from 'react-feather'

import { Pill } from 'app/lib/primitives'

interface Props {
  ahead?: number
  behind?: number
  selected?: boolean
}

export function BranchUpstreamState({
  ahead = 0,
  behind = 0,
  selected = false,
}: Props) {
  const inSync = ahead === 0 && behind === 0

  return (
    <Pill.Container marginRight={0}>
      <Pill.Segment
        data-testid="remoteInSync"
        current={selected}
        warning={false}>
        {inSync && (
          <>
            <Cloud size={15} />
          </>
        )}

        {ahead > 0 && (
          <>
            <ArrowUp data-testid="remoteAhead" size={15} />
            {ahead}
          </>
        )}

        {behind > 0 && (
          <>
            <ArrowDown data-testid="remoteBehind" size={15} />
            {behind}
          </>
        )}

        {!inSync && ahead == null && behind == null && <>Head</>}
      </Pill.Segment>
    </Pill.Container>
  )
}
