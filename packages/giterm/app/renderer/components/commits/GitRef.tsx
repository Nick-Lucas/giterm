import React from 'react'
import { useSelector } from 'app/store'
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
      return <GitBranch data-testid="localBranch" {...iconProps} />

    case 'remote-branch':
      return <Cloud data-testid="remoteBranch" {...iconProps} />

    case 'tag':
      return <Tag data-testid="tag" {...tagProps} />
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
  const show = useSelector((state) => state.config.showBranchTags)
  if (!show) {
    return null
  }

  return (
    <Pill.Container data-testid={`ref-${label}`}>
      <Pill.Segment current={current}>{iconFromType(type)}</Pill.Segment>

      {type === 'branch' && remoteInSync && (
        <Pill.Segment data-testid="remoteInSync" current={current}>
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
              <ArrowUp data-testid="remoteAhead" {...iconProps} size={14} />
              {ahead}
            </>
          )}

          {behind > 0 && (
            <>
              <ArrowDown data-testid="remoteBehind" {...iconProps} size={14} />
              {behind}
            </>
          )}
        </Pill.Segment>
      )}
    </Pill.Container>
  )
}
