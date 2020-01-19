import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'

export function Section({ title, children }) {
  const [open, setOpen] = useState(true)
  const toggleOpen = useCallback(() => {
    setOpen((open) => !open)
  }, [])

  return (
    <Container>
      <Button onClick={toggleOpen}>
        <Chevron open={open} width="2rem" />
        <h2>{title}</h2>
      </Button>

      {/* TODO: make transition on this pretty */}
      {open && children}
    </Container>
  )
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
}

const Container = styled.div`
  margin-bottom: 1rem;
`

const Button = styled.button`
  display: flex;
  flex-direction: row;
  flex: 1;
  height: 1.5rem;

  align-items: center;
  justify-content: flex-start;

  background-color: transparent;
  color: inherit;
  border: none;
  outline: none;
  cursor: pointer;

  margin-top: 0.5rem;
  padding: 0;

  h2 {
    font-size: 14px;
    font-weight: normal;
    margin: 0;
    padding: 0;
  }
`

const Chevron = styled(ChevronDown)`
  transition: transform ease-in-out 0.3s;
  transform: ${({ open }) => (open ? 'rotate(0deg)' : 'rotate(-180deg)')};
`
