import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import styled from 'styled-components'

import { refreshApplication } from '../../store/coreapp'

import * as XTerm from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'
import os from 'os'
import { spawn } from 'node-pty'

import debounce from 'debounce'
import { bindServices } from '../../lib/di'

const TerminalContainer = styled.div`
  display: flex;
  flex: 1;
  margin: 5px;
`

export class Terminal extends React.Component {
  constructor(props) {
    super(props)
    this.container = React.createRef()
    this.debouncedRefreshApplication = debounce(
      () => props.refreshApplication(props.gitService),
      50,
    )
  }

  componentDidMount() {
    this.setupTerminal()
  }

  setupTerminal = () => {
    this.ptyProcess = this.setupPTY()
    this.terminal = this.setupXTerm()
    this.setupTerminalEvents(this.ptyProcess, this.terminal)
    this.container.current.focus()
  }

  setupPTY = () => {
    const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL']
    const ptyProcess = spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: '/Users/nick/dev/domain-store',
      env: { ...process.env, PS1: this.getBashPrompt() },
    })
    return ptyProcess
  }

  setupXTerm = () => {
    XTerm.Terminal.applyAddon(fit)
    const terminal = new XTerm.Terminal({
      allowTransparency: true,
      fontFamily: 'Inconsolata, monospace',
      fontSize: 16,
      theme: {
        background: 'rgba(255, 255, 255, 0)',
      },
    })
    terminal.open(this.container.current)
    terminal.fit()
    return terminal
  }

  setupTerminalEvents = () => {
    const that = this

    that.terminal.on('data', (data) => {
      that.ptyProcess.write(data)
    })

    that.terminal.on('linefeed', (e) => {
      that.debouncedRefreshApplication()
    })

    that.ptyProcess.on('data', function(data) {
      that.terminal.write(data)
    })

    // // TODO: this doesn't work
    // that.ptyProcess.on('exit', () => {
    //   console.log('recreating')
    //   that.setupXTerm()
    //   that.setupTerminalEvents()
    // })
  }

  getBashPrompt = () => {
    // TODO: find a way to make this dynamic
    // const { branchName } = this.props
    process.env['GITERM_BRANCH'] = 'giterm'
    return '\\W $GITERM_BRANCH> '
  }

  render() {
    process.env.PS1 = this.getBashPrompt()
    return <TerminalContainer innerRef={this.container} />
  }
}

Terminal.propTypes = {}

const ConnectedTerminal = connect(
  ({ status: { branchName } }) => ({ branchName }),
  {
    refreshApplication,
  },
)(Terminal)

export default bindServices(({ git }) => ({ gitService: git }))(
  ConnectedTerminal,
)
