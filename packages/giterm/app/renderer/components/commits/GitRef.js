import React from 'react'
import PropTypes from 'prop-types'
import { Cloud, Target, GitBranch } from 'react-feather'
import styled, { css } from 'styled-components'
import { useSelector } from 'react-redux'
import * as props from './props'

const Pill = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 5px;

  padding-left: 3px;
  padding-right: 3px;
  margin-right: 5px;

  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;

  background-color: rgba(255, 255, 255, 0.6);
  ${(props) =>
    props.current &&
    css`
      background-color: rgba(200, 255, 200, 0.8);
    `};
`

const Content = styled.div`
  padding-bottom: 2px;
`

const Bar = styled.div`
  border-left: solid 1px;
  border-left-color: currentColor;
  margin: 0 2px;
  height: 100%;
`

const iconProps = {
  size: '12',
  style: { marginBottom: '-1px' },
}

export function GitRef({ type, label, current, remoteInSync }) {
  const show = useSelector((state) => state.config.showBranchTags)
  if (!show) {
    return null
  }

  return (
    <Pill current={current}>
      {type === 'branch' ? (
        <GitBranch {...iconProps} />
      ) : (
        <Target {...iconProps} />
      )}
      {remoteInSync && (
        <>
          <Bar /> <Cloud {...iconProps} />
        </>
      )}

      <Bar />

      <Content>{label}</Content>
    </Pill>
  )
}

GitRef.propTypes = {
  label: PropTypes.string.isRequired,
  current: PropTypes.bool,
  remoteInSync: PropTypes.bool,
  type: props.refTypes.isRequired,
}
