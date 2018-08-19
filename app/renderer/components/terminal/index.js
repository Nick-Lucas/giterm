import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import styled from 'styled-components'

import Terminal from './terminal'

import { Minimize2, Maximize2 } from 'react-feather'
import {
  setTerminalFullscreen,
  flipTerminalFullscreen,
} from '../../store/config'

const Wrapper = styled.div`
  flex: 1;
  flex-direction: column;
`

const TerminalWrapper = styled.div`
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
  cursor: pointer;
`

export class TerminalPanel extends React.Component {
  flipTerminalFullscreen = (e) => {
    this.props.flipTerminalFullscreen()
    e.stopPropagation()
  }

  render() {
    const { terminalFullscreen, setTerminalFullscreen } = this.props
    return (
      <Wrapper>
        <MenuPanel>
          <MenuItem
            title={
              terminalFullscreen ? 'Minimise (ctl+tab)' : 'Maximise (ctl+tab)'
            }
            onClick={this.flipTerminalFullscreen}>
            {terminalFullscreen ? (
              <Minimize2 size={20} />
            ) : (
              <Maximize2 size={20} />
            )}
          </MenuItem>
        </MenuPanel>
        <TerminalWrapper>
          <Terminal onAlternateBufferChange={setTerminalFullscreen} />
        </TerminalWrapper>
      </Wrapper>
    )
  }
}

TerminalPanel.propTypes = {}

export default connect(
  ({ config: { terminalFullscreen } }) => ({
    terminalFullscreen,
  }),
  { setTerminalFullscreen, flipTerminalFullscreen },
)(TerminalPanel)
