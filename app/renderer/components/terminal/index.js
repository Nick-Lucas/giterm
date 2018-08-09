import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import * as XTerm from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'

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
    this.terminal = new XTerm.Terminal({
      allowTransparency: true,
      fontFamily: 'Inconsolata, monospace',
      fontSize: 16,
      theme: {
        background: 'rgba(255, 255, 255, 0)',
      },
    })
    this.terminal.open(this.container.current)
    this.terminal.write('giterm> ')
    this.terminal.fit()
  }

  render() {
    return <TerminalContainer innerRef={this.container} />
  }
}

Terminal.propTypes = {}
