import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import * as XTerm from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'

import os from 'os'
import { spawn } from 'node-pty'
console.log(spawn)

const TerminalContainer = styled.div`
  display: flex;
  flex: 1;
  margin: 5px;
`

export default class Terminal extends React.Component {
  constructor(props) {
    super(props)
    this.container = React.createRef()
  }

  componentDidMount() {
    this.setupTerminal()
  }

  setupTerminal = () => {
    // PTY
    const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL']
    const ptyProcess = spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env,
    })

    // XTERM
    XTerm.Terminal.applyAddon(fit)
    this.terminal = new XTerm.Terminal({
      allowTransparency: true,
      fontFamily: 'Inconsolata, monospace',
      fontSize: 16,
      theme: {
        background: 'rgba(255, 255, 255, 0)',
      },
    })
    this.terminal.open(this.container.current)
    // this.terminal.write('giterm> ')
    this.terminal.fit()

    // EVENTS
    const term = this.terminal
    this.terminal.on('data', (data) => {
      ptyProcess.write(data)
    })
    ptyProcess.on('data', function(data) {
      term.write(data)
    })
  }

  render() {
    return <TerminalContainer innerRef={this.container} />
  }
}

Terminal.propTypes = {}
