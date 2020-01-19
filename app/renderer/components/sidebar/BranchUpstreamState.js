import React from 'react'
import PropTypes from 'prop-types'
import { ArrowUp, ArrowDown, ThumbsUp } from 'react-feather'
import styled from 'styled-components'

export function BranchUpstreamState({ ahead, behind }) {
  return (
    <Container>
      {ahead === 0 && behind === 0 ? (
        <>
          <ThumbsUp size={15} />
        </>
      ) : (
        <>
          <ArrowUp size={15} />
          {ahead}
          <ArrowDown size={15} />
          {behind}
        </>
      )}
    </Container>
  )
}

BranchUpstreamState.propTypes = {
  ahead: PropTypes.number.isRequired,
  behind: PropTypes.number.isRequired,
}

const Container = styled.div`
  display: flex;
  align-items: center;

  background-color: rgba(255, 255, 255, 0.6);
  color: rgba(0, 0, 0, 0.5);

  border-radius: 5px;
  padding-left: 2px;
  padding-right: 2px;
  padding-bottom: 1px;
  padding-top: 1px;
`
