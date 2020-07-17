import React from 'react'
import styled, { css } from 'styled-components'
import PropTypes from 'prop-types'

export function StatusBarItem({ title, colour, children }) {
  return (
    <Container>
      {title && <Label>{title}</Label>}
      {children && <Body colour={colour}>{children}</Body>}
    </Container>
  )
}

StatusBarItem.propTypes = {
  colour: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.node,
}

const Container = styled.div`
  display: flex;
  margin-right: 5px;
  align-items: center;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  ${(props) =>
    props.width &&
    css`
      min-width: ${props.width}px;
      max-width: ${props.width}px;
    `};
`

const Label = styled.div`
  margin-right: 2px;
`
const Body = styled.div`
  display: flex;
  align-items: center;

  color: ${(props) => props.colour || 'inherit'};
`
