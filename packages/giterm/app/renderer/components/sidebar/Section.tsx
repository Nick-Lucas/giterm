import React, { useState, useCallback } from 'react'
import { ChevronDown, Minus } from 'react-feather'
import styled from 'styled-components'

interface Props {
  title: string
  children: any
  hasContent?: boolean
  initialOpenState?: boolean
  icon: any
}

export function Section({
  title,
  children,
  hasContent = true,
  initialOpenState = true,
  icon = null,
  ...props
}: Props) {
  const [open, setOpen] = useState(initialOpenState)
  const toggleOpen = useCallback(() => {
    setOpen((open) => !open)
  }, [])

  return (
    <Container {...props} open={open && hasContent}>
      <Button onClick={toggleOpen} disabled={!hasContent}>
        {hasContent ? (
          <Chevron open={open} width="2rem" />
        ) : (
          <Minus width="2rem" />
        )}

        <h2>{title}</h2>

        <Fill />
        <IconContainer>{icon}</IconContainer>
      </Button>

      {/* TODO: make transition on this pretty */}
      {open && hasContent && children}
    </Container>
  )
}

const Container = styled.div<{ open: boolean }>`
  margin-bottom: ${({ open }) => (open ? '1rem' : '0')};
`

const Button = styled.button`
  display: flex;
  flex-direction: row;
  flex: 1;
  height: 1.5rem;
  width: stretch;

  align-items: center;
  justify-content: flex-start;

  background-color: transparent;
  color: inherit;
  border: none;
  outline: none;

  cursor: pointer;
  :disabled {
    cursor: default;
  }

  margin-top: 0.5rem;
  padding: 0;

  h2 {
    font-size: 14px;
    font-weight: normal;
    margin: 0;
    padding: 0;
  }
`

const Chevron = styled(ChevronDown)<{ open: boolean }>`
  transition: transform ease-in-out 0.3s;
  transform: ${({ open }) => (open ? 'rotate(0deg)' : 'rotate(-180deg)')};
`

const Fill = styled.div`
  display: flex;
  flex: 1;
`

const IconContainer = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-column-gap: 2px;

  padding-right: 0.25rem;
`
