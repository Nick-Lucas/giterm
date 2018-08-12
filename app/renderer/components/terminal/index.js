import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import styled from 'styled-components'

import Terminal from './terminal'

import { Minimize2, Maximize2 } from 'react-feather'
import { flipTerminalFullscreen } from '../../store/config'

const Wrapper = styled.div`
  flex: 1;
  position: relative;
`

const MenuPanel = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  padding: 3px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
`

const MenuItem = styled.div`
  cursor: pointer;
`

export class TerminalPanel extends React.Component {
  render() {
    const { terminalFullscreen, flipTerminalFullscreen } = this.props
    return (
      <Wrapper>
        <Terminal />
        <MenuPanel>
          <MenuItem
            title={
              terminalFullscreen ? 'Minimise (ctl+tab)' : 'Maximise (ctl+tab)'
            }
            onClick={flipTerminalFullscreen}>
            {terminalFullscreen ? (
              <Minimize2 size={20} />
            ) : (
              <Maximize2 size={20} />
            )}
          </MenuItem>
        </MenuPanel>
      </Wrapper>
    )
  }
}

TerminalPanel.propTypes = {}

export default connect(
  ({ config: { terminalFullscreen } }) => ({
    terminalFullscreen,
  }),
  { flipTerminalFullscreen },
)(TerminalPanel)
