import React, { useContext } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

import { Context } from './Context'
import { colours } from 'app/lib/theme'

export function Show(props) {
  const element = useContext(Context)

  if (!element) {
    return null
  }

  return createPortal(<MenuWrapper {...props} />, element)
}

const MenuWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  padding: 3px;

  z-index: 1000;

  /* Anchor to top right of view */
  position: absolute;
  top: 0;
  right: 0;

  background-color: ${colours.palette.bg};
  border-bottom-left-radius: 5px;
  border-bottom: solid gray 1px;
  border-left: solid gray 1px;
`

export const Item = styled.div`
  display: flex;
  cursor: pointer;

  margin-right: 0.25rem;
  :last-child {
    margin-right: 0;
  }
`
