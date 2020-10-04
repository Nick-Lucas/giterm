import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import { Terminal } from './terminal'

import { Minimize2, Maximize2 } from 'react-feather'
import {
  autoTerminalFullscreen,
  flipUserTerminalFullscreen,
} from 'app/store/terminal/actions'

import { Panel, Menu } from 'app/lib/primitives'

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
    <StyledPanel>
      <Menu.Show>
        <Menu.Item
          title={fullscreen ? 'Minimise (ctl+tab)' : 'Maximise (ctl+tab)'}
          onClick={handleUserToggle}>
          {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </Menu.Item>
      </Menu.Show>

      <TerminalWrapper>
        <Terminal onAlternateBufferChange={handleBufferChange} />
      </TerminalWrapper>
    </StyledPanel>
  )
}

const StyledPanel = styled(Panel)`
  display: flex;
  flex: 1;
  flex-direction: column;
`

const TerminalWrapper = styled.div`
  display: flex;
  flex: 1;
`
