import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import styled from 'styled-components'
import debounce from 'debounce'

import * as XTerm from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { spawn } from 'node-pty'

import { shell } from 'electron'
import { exec } from 'child_process'

import { refreshApplication } from '../../store/coreapp'
import { updateCwd } from '../../store/config'
import { isStartAlternateBuffer, isEndAlternateBuffer } from './xterm-control'
import { BASHRC_PATH } from './bash-config'

const TerminalContainer = styled.div`
  display: flex;
  flex: 1;
  margin: 5px;
`

const terminalOpts = {
  allowTransparency: true,
  fontFamily: 'Inconsolata, monospace',
  fontSize: 16,
  theme: {
    background: 'rgba(255, 255, 255, 0)',
  },
  cursorStyle: 'bar',
}

export class Terminal extends React.Component {
  constructor(props) {
    super(props)
    this.container = React.createRef()
    this.state = {
      alternateBuffer: false,
      focused: false,
    }
  }

  componentDidMount() {
    this.setupTerminal()
  }

  componentDidUpdate(prevProps) {
    if (this.terminal) {
      const { fullscreen: wasFS } = prevProps
      const { fullscreen: isFS } = this.props
      if (wasFS !== isFS) {
        this.resizeTerminal()
      }
    }
  }

  resizeTerminal = () => {
    if (this.terminal) {
      this.terminal.resize(10, 10)
      this.fit.fit()
    }
  }

  updateAlternateBuffer = debounce((active) => {
    // ensure xterm has a few moments to trigger its
    // own re-render before we trigger a resize
    setTimeout(() => {
      this.setState({ alternateBuffer: active })
      this.props.onAlternateBufferChange(active)
    }, 5)
  }, 5)

  setupTerminal = () => {
    this.ptyProcess = this.setupPTY()
    this.terminal = this.setupXTerm()
    setTimeout(() => {
      // Ensures that the terminal initialises with the correct style
      this.resizeTerminal()
    }, 5)
    this.setupTerminalEvents()
    this.terminal.focus()
  }

  setupPTY = () => {
    // TODO: integrate user preferences into this. Allow for (or bundle?) git-bash on windows
    const shell = '/bin/bash' //process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL']
    const ptyProcess = spawn(shell, ['--noprofile', '--rcfile', BASHRC_PATH], {
      name: 'xterm-color',
      cwd: this.props.cwd,
      env: {
        ...process.env,
        GITERM_RC: BASHRC_PATH,
      },
    })

    return ptyProcess
  }

  setupXTerm = () => {
    const terminal = new XTerm.Terminal(terminalOpts)

    this.fit = new FitAddon()
    const weblinks = new WebLinksAddon((ev, uri) => {
      if (ev.metaKey) {
        shell.openExternal(uri)
      }
    })

    terminal.loadAddon(this.fit)
    terminal.loadAddon(weblinks)
    terminal.open(this.container.current)

    return terminal
  }

  setupTerminalEvents = () => {
    const that = this

    that.terminal.onData((data) => {
      that.ptyProcess.write(data)
    })
    that.ptyProcess.onData(function(data) {
      that.terminal.write(data)

      if (isStartAlternateBuffer(data)) {
        that.updateAlternateBuffer(true)
      }
      if (isEndAlternateBuffer(data)) {
        that.updateAlternateBuffer(false)
      }
    })

    that.terminal.onLineFeed(
      debounce(() => {
        that.getCWD(that.ptyProcess.pid).then((cwd) => {
          const { updateCwd, refreshApplication } = that.props
          const { alternateBuffer } = that.state
          if (!alternateBuffer) {
            updateCwd(cwd)
            refreshApplication()
          }
        })
      }, 300),
    )

    window.addEventListener('resize', debounce(this.resizeTerminal, 5), false)
    that.terminal.onResize(
      debounce(({ cols, rows }) => {
        that.ptyProcess.resize(cols, rows)
      }, 5),
    )

    that.terminal.textarea.onblur = () => that.setState({ focused: false })
    that.terminal.onfocus = () => that.setState({ focused: true })
    window.addEventListener('keydown', () => {
      if (!that.state.focused) {
        that.terminal.focus()
      }
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
    return <TerminalContainer ref={this.container} />
  }
}

Terminal.propTypes = {
  onAlternateBufferChange: PropTypes.func.isRequired,
}

export default connect(
  ({ status: { branchName }, config: { cwd }, terminal: { fullscreen } }) => ({
    branchName,
    cwd,
    fullscreen,
  }),
  {
    refreshApplication,
    updateCwd,
  },
)(Terminal)
