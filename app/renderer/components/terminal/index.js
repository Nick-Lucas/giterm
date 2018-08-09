import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import * as XTerm from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'
import * as terminado from 'xterm/lib/addons/terminado/terminado'

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
    XTerm.Terminal.applyAddon(fit)
    XTerm.Terminal.applyAddon(terminado)

    this.terminal = new XTerm.Terminal({
      allowTransparency: true,
      fontFamily: 'Inconsolata, monospace',
      fontSize: 16,
      theme: {
        background: 'rgba(255, 255, 255, 0)',
      },
    })

    console.log(location)
    var socket = new WebSocket('ws://localhost:8010/websocket')

    socket.addEventListener('open', () => {
      console.log('CONNECTED')
      this.terminal.terminadoAttach(socket, true, false)
    })

    socket.addEventListener('close', () => {
      this.setupTerminal()
    })

    this.terminal.open(this.container.current)
    // this.terminal.write('giterm> ')
    this.terminal.fit()
  }

  render() {
    return <TerminalContainer innerRef={this.container} />
  }
}

Terminal.propTypes = {}
