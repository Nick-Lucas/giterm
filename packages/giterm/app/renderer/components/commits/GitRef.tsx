import React from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { Cloud, Tag, GitBranch, ArrowUp, ArrowDown } from 'react-feather'

import { Pill } from 'app/lib/primitives'
import { RefType } from './props'

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

function iconFromType(type: RefType) {
  switch (type) {
    case 'branch':
      return <GitBranch {...iconProps} />

    case 'remote-branch':
      return <Cloud {...iconProps} />

    case 'tag':
      return <Tag {...tagProps} />
  }
}

interface Props {
  type: RefType
  label: string
  current?: boolean
  remoteInSync?: boolean
  ahead?: number
  behind?: number
}

export function GitRef({
  type,
  label,
  current,
  remoteInSync,
  ahead = 0,
  behind = 0,
}: Props) {
  const show = useSelector((state: any) => state.config.showBranchTags)
  if (!show) {
    return null
  }

  return (
    <Pill.Container>
      <Pill.Segment current={current}>{iconFromType(type)}</Pill.Segment>

      {type === 'branch' && remoteInSync && (
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
