import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { useSelector } from 'react-redux'
import { Cloud, Target, GitBranch, ArrowUp, ArrowDown } from 'react-feather'

import { colours } from 'app/lib/theme'
import * as propTypes from './props'

const iconProps = {
  size: '12',
  style: { marginBottom: '-1px' },
}

function iconFromType(type) {
  switch (type) {
    case propTypes.REF_TYPE_BRANCH:
      return <GitBranch {...iconProps} />

    case propTypes.REF_TYPE_REMOTE_BRANCH:
      return <Cloud {...iconProps} />

    case propTypes.REF_TYPE_TAG:
      return <Target {...iconProps} />
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
    <PillFill>
      <Pill current={current}>{iconFromType(type)}</Pill>

      {type === propTypes.REF_TYPE_BRANCH && remoteInSync && (
        <Pill current={current}>
          {/* <Bar /> */}
          <Cloud {...iconProps} />
        </Pill>
      )}

      {/* <Bar /> */}

      <Pill current={current}>
        <Content>{label}</Content>
      </Pill>

      {ahead + behind > 0 && (
        <Pill current={current} warning>
          {/* <Bar /> */}

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
        </Pill>
      )}
    </PillFill>
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

const PillFill = styled.div`
  display: flex;
  flex-direction: row;
  flex: 0;

  margin-right: 5px;
`

const Pill = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  padding-left: 3px;
  padding-right: 3px;

  border-left: solid 1px;
  border-left-color: currentColor;

  :first-child {
    border-left: none;
    border-bottom-left-radius: 5px;
    border-top-left-radius: 5px;
  }
  :last-child {
    border-bottom-right-radius: 5px;
    border-top-right-radius: 5px;
  }

  color: ${colours.PILL.FG};
  white-space: nowrap;

  background-color: ${colours.PILL.BG};
  ${({ current }) =>
    current &&
    css`
      background-color: ${colours.PILL.BG_ACTIVE};
    `};
  ${({ warning }) =>
    warning &&
    css`
      background-color: ${colours.PILL.BG_WARNING};
    `};
`

const Content = styled.div`
  padding-bottom: 2px;

  padding-left: 0.15rem;
  padding-right: 0.15rem;
`
