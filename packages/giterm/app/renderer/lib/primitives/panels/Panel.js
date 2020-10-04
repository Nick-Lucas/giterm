import React, { useState, useRef, useLayoutEffect } from 'react'
import styled from 'styled-components'

import { Context } from './Context'

export function Panel(props) {
  const [element, setElement] = useState(null)

  const ref = useRef()
  useLayoutEffect(() => {
    setElement(ref.current)
  }, [])

  return (
    <Context.Provider value={element}>
      <PortalExitWrapper {...props} ref={ref} />
    </Context.Provider>
  )
}

const PortalExitWrapper = styled.div`
  position: relative;
`
