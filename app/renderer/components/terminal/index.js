import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'

import { Terminal } from './terminal'

import { Minimize2, Maximize2 } from 'react-feather'
import {
  autoTerminalFullscreen,
  flipUserTerminalFullscreen,
} from '../../store/terminal/actions'

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

export class TerminalPanel extends React.Component {
  flipUserTerminalFullscreen = (e) => {
    this.props.flipUserTerminalFullscreen()
    e.stopPropagation()
  }

  render() {
    const { fullscreen, autoTerminalFullscreen } = this.props
    return (
      <Wrapper>
        <MenuPanel>
          <MenuItem
            title={fullscreen ? 'Minimise (ctl+tab)' : 'Maximise (ctl+tab)'}
            onClick={this.flipUserTerminalFullscreen}>
            {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </MenuItem>
        </MenuPanel>

        <TerminalWrapper>
          <Terminal onAlternateBufferChange={autoTerminalFullscreen} />
        </TerminalWrapper>
      </Wrapper>
    )
  }
}

TerminalPanel.propTypes = {}

export default connect(
  ({ terminal: { fullscreen } }) => ({
    fullscreen,
  }),
  { autoTerminalFullscreen, flipUserTerminalFullscreen },
)(TerminalPanel)
