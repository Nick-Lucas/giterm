import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import { Terminal } from './terminal'

import { Minimize2, Maximize2 } from 'react-feather'
import {
  autoTerminalFullscreen,
  flipUserTerminalFullscreen,
} from 'app/store/terminal/actions'

export function TerminalPanel() {
  const dispatch = useDispatch()
  const { fullscreen } = useSelector((state) => state.terminal)

  const handleBufferChange = useCallback(
    (fullscreen) => {
      dispatch(autoTerminalFullscreen(fullscreen))
    },
    [dispatch],
  )
  const handleUserToggle = useCallback(() => {
    dispatch(flipUserTerminalFullscreen())
  }, [dispatch])

  return (
    <Wrapper>
      <MenuPanel>
        <MenuItem
          title={fullscreen ? 'Minimise (ctl+tab)' : 'Maximise (ctl+tab)'}
          onClick={handleUserToggle}>
          {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </MenuItem>
      </MenuPanel>

      <TerminalWrapper>
        <Terminal onAlternateBufferChange={handleBufferChange} />
      </TerminalWrapper>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`

const TerminalWrapper = styled.div`
  display: flex;
  flex: 1;
`

const MenuPanel = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  padding: 3px;

  position: absolute;
  left: 0;
  right: 0;
`

const MenuItem = styled.div`
  display: flex;
  cursor: pointer;
`
