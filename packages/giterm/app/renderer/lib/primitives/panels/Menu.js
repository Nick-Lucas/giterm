import React, { useContext } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

import { Context } from './Context'

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

  position: absolute;
  left: 0;
  right: 0;
`

export const Item = styled.div`
  display: flex;
  cursor: pointer;
`
