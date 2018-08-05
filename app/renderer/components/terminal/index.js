import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import * as XTerm from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'

const TerminalContainer = styled.div`
  display: flex;
  flex: 1;
`

const TERMINAL_NODE = 'xterm-node'

export default class Terminal extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.setupTerminal()
  }

  setupTerminal = () => {
    XTerm.Terminal.applyAddon(fit)
    this.terminal = new XTerm.Terminal({
      allowTransparency: true,
      fontFamily: 'Inconsolata, monospace',
      fontSize: 16,
      theme: {
        background: 'rgba(255, 255, 255, 0)',
      },
    })
    this.terminal.open(this.container)
    this.terminal.write('giterm> ')
    this.terminal.fit()
  }

  render() {
    return <TerminalContainer innerRef={(ref) => (this.container = ref)} />
  }
}

Terminal.propTypes = {}
