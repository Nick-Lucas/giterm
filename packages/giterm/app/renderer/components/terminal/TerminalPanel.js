import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'

import { Terminal } from './terminal'

import { autoTerminalFullscreen } from 'app/store/terminal/actions'

import { Panel } from 'app/lib/primitives'
import { LowerPanelMenu } from 'app/components/common'

export function TerminalPanel({ show }) {
  const dispatch = useDispatch()

  const handleBufferChange = useCallback(
    (fullscreen) => {
      dispatch(autoTerminalFullscreen(fullscreen))
    },
    [dispatch],
  )

  return (
    <StyledPanel show={show}>
      <LowerPanelMenu />

      <TerminalWrapper>
        <Terminal isShown={show} onAlternateBufferChange={handleBufferChange} />
      </TerminalWrapper>
    </StyledPanel>
  )
}

const StyledPanel = styled(Panel)`
  display: ${({ show }) => (show ? 'flex' : 'none')};
  flex: 1;
  flex-direction: column;
`

const TerminalWrapper = styled.div`
  display: flex;
  flex: 1;
`
