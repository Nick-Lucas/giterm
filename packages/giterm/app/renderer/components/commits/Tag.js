import React from 'react'
import PropTypes from 'prop-types'
import { ThumbsUp } from 'react-feather'
import styled, { css } from 'styled-components'
import { useSelector } from 'react-redux'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 5px;

  padding-left: 3px;
  padding-right: 3px;
  padding-bottom: 2px;
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

export function Tag({ label, current, remoteInSync }) {
  const show = useSelector((state) => state.config.showBranchTags)
  if (!show) {
    return null
  }

  return (
    <Wrapper current={current}>
      {label}{' '}
      {remoteInSync && (
        <ThumbsUp
          size="12"
          style={{ marginLeft: '2px', marginBottom: '-1px' }}
        />
      )}
    </Wrapper>
  )
}

Tag.propTypes = {
  label: PropTypes.string.isRequired,
  current: PropTypes.bool.isRequired,
  remoteInSync: PropTypes.bool.isRequired,
}
