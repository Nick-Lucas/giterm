import React from 'react'
import PropTypes from 'prop-types'
import { ArrowUp, ArrowDown, Cloud } from 'react-feather'

import { Pill } from 'app/lib/primitives'

export function BranchUpstreamState({
  ahead = null,
  behind = null,
  selected = false,
}) {
  const inSync = ahead === 0 && behind === 0

  return (
    <Pill.Container marginRight={0}>
      <Pill.Segment current={selected} warning={false}>
        {inSync && (
          <>
            <Cloud size={15} />
          </>
        )}

        {ahead > 0 && (
          <>
            <ArrowUp size={15} />
            {ahead}
          </>
        )}

        {behind > 0 && (
          <>
            <ArrowDown size={15} />
            {behind}
          </>
        )}

        {!inSync && ahead == null && behind == null && <>Head</>}
      </Pill.Segment>
    </Pill.Container>
  )
}

BranchUpstreamState.propTypes = {
  ahead: PropTypes.number,
  behind: PropTypes.number,
  selected: PropTypes.bool,
}
