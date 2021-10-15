import React from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { Cloud, Tag, GitBranch, ArrowUp, ArrowDown } from 'react-feather'

import { Pill } from 'app/lib/primitives'
import * as propTypes from './props'

const iconProps = {
  size: '12',
  style: { marginBottom: '-1px' },
}

const tagProps = {
  ...iconProps,
  style: {
    ...iconProps,
    marginRight: '-1px',
  },
}

function iconFromType(type) {
  switch (type) {
    case propTypes.REF_TYPE_BRANCH:
      return <GitBranch {...iconProps} />

    case propTypes.REF_TYPE_REMOTE_BRANCH:
      return <Cloud {...iconProps} />

    case propTypes.REF_TYPE_TAG:
      return <Tag {...tagProps} />
  }
}

export function GitRef({
  type,
  label,
  current,
  remoteInSync,
  ahead = 0,
  behind = 0,
}) {
  const show = useSelector((state) => state.config.showBranchTags)
  if (!show) {
    return null
  }

  return (
    <Pill.Container>
      <Pill.Segment current={current}>{iconFromType(type)}</Pill.Segment>

      {type === propTypes.REF_TYPE_BRANCH && remoteInSync && (
        <Pill.Segment current={current}>
          <Cloud {...iconProps} />
        </Pill.Segment>
      )}

      <Pill.Segment current={current}>
        <Pill.Content>{label}</Pill.Content>
      </Pill.Segment>

      {ahead + behind > 0 && (
        <Pill.Segment current={current} warning>
          {ahead > 0 && (
            <>
              <ArrowUp {...iconProps} size={14} />
              {ahead}
            </>
          )}

          {behind > 0 && (
            <>
              <ArrowDown {...iconProps} size={14} />
              {behind}
            </>
          )}
        </Pill.Segment>
      )}
    </Pill.Container>
  )
}

GitRef.propTypes = {
  label: PropTypes.string.isRequired,
  current: PropTypes.bool,
  remoteInSync: PropTypes.bool,
  type: propTypes.refTypes.isRequired,
  ahead: PropTypes.number,
  behind: PropTypes.number,
}
