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

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { updateCwd } from '../../store/config'

const BASHRC_PATH = path.resolve('./dist-assets/.bashrc')
if (!fs.existsSync(BASHRC_PATH)) {
  // TODO: ensure that packaging process includes this properly
  throw `.bashrc not found: ${BASHRC_PATH}`
}

const TerminalContainer = styled.div`
  display: flex;
  flex: 1;
  margin: 5px;
`

export class Terminal extends React.Component {
  constructor(props) {
    super(props)
    this.container = React.createRef()
    this.debouncedUpdateCwd = debounce(props.updateCwd, 50)
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
    this.terminal.focus()
  }

  setupPTY = () => {
    // TODO: integrate user preferences into this. Allow for (or bundle?) git-bash on windows
    const shell = '/bin/bash' //process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL']
    const ptyProcess = spawn(shell, ['--noprofile', '--rcfile', BASHRC_PATH], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: this.props.cwd,
      env: {
        ...process.env,
        PS1: '\n\\W> ',
        GITERM_RC: BASHRC_PATH,
      },
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

    that.terminal.on(
      'linefeed',
      debounce(() => {
        that.getCWD(that.ptyProcess.pid).then((cwd) => {
          const { updateCwd, refreshApplication, gitService } = that.props
          updateCwd(cwd)
          refreshApplication(gitService)
        })
      }, 50),
    )

    that.ptyProcess.on('data', function(data) {
      that.terminal.write(data)
    })

    // // TODO: ensure the process can't be exited and restart if need be
    // that.ptyProcess.on('exit', () => {
    //   console.log('recreating')
    //   that.setupXTerm()
    //   that.setupTerminalEvents()
    // })
  }

  // TODO: check if lsof is on system and have alternatives in mind per platform
  getCWD = async (pid) =>
    new Promise((resolve) => {
      exec(`lsof -p ${pid} | grep cwd | awk '{print $NF}'`, (e, stdout) => {
        if (e) {
          throw e
        }
        resolve(stdout)
      })
    })

  render() {
    return <TerminalContainer innerRef={this.container} />
  }
}

Terminal.propTypes = {}

const ConnectedTerminal = connect(
  ({ status: { branchName }, config: { cwd } }) => ({ branchName, cwd }),
  {
    refreshApplication,
    updateCwd,
  },
)(Terminal)

export default bindServices(({ git }) => ({ gitService: git }))(
  ConnectedTerminal,
)
