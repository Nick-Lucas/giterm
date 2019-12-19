import React, {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import debounce from 'debounce'

import * as XTerm from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { spawn } from 'node-pty'

import { shell } from 'electron'
import { exec } from 'child_process'

import { terminalChanged } from '../../store/terminal/actions'
import { INITIAL_CWD } from '../../lib/cwd'
import { isStartAlternateBuffer, isEndAlternateBuffer } from './xterm-control'
import { BASHRC_PATH } from './bash-config'

const terminalOpts = {
  allowTransparency: true,
  fontFamily: 'Inconsolata, monospace',
  fontSize: 16,
  theme: {
    background: 'rgba(255, 255, 255, 0)',
  },
  cursorStyle: 'bar',
}

export function Terminal({ onAlternateBufferChange }) {
  const dispatch = useDispatch()
  const container = useRef()

  const cwd = useSelector((state) => state.config.cwd) || INITIAL_CWD
  const cwdStaticRef = useRef(cwd)

  const { fullscreen } = useSelector((state) => state.terminal)

  const [alternateBuffer, setAlternateBuffer] = useState(false)
  const [focused, setFocused] = useState(false)

  const ptyProcess = useMemo(() => {
    // TODO: integrate user preferences into this. Allow for (or bundle?) git-bash on windows
    const shell = '/bin/bash' //process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL']
    const ptyProcess = spawn(shell, ['--noprofile', '--rcfile', BASHRC_PATH], {
      name: 'xterm-color',
      cwd: cwdStaticRef.current,
      env: {
        ...process.env,
        GITERM_RC: BASHRC_PATH,
      },
    })

    return ptyProcess
  }, [])

  const [terminal, fit] = useMemo(() => {
    const terminal = new XTerm.Terminal(terminalOpts)
    const fit = new FitAddon()

    const weblinks = new WebLinksAddon((ev, uri) => {
      if (ev.metaKey) {
        shell.openExternal(uri)
      }
    })

    terminal.loadAddon(fit)
    terminal.loadAddon(weblinks)

    return [terminal, fit]
  }, [])
  useEffect(
    () => {
      terminal.open(container.current)
    },
    [terminal],
  )

  // TODO: check if lsof is on system and have alternatives in mind per platform
  const getCWD = useCallback(
    async (pid) =>
      new Promise((resolve) => {
        exec(`lsof -p ${pid} | grep cwd | awk '{print $NF}'`, (e, stdout) => {
          if (e) {
            throw e
          }
          resolve(stdout)
        })
      }),
    [],
  )

  const updateAlternateBuffer = useMemo(
    () =>
      debounce((active) => {
        // ensure xterm has a few moments to trigger its
        // own re-render before we trigger a resize
        setTimeout(() => {
          setAlternateBuffer(active)
          onAlternateBufferChange(active)
        }, 5)
      }, 5),
    [onAlternateBufferChange],
  )

  const handleResizeTerminal = useCallback(
    () => {
      terminal.resize(10, 10)
      fit.fit()
      terminal.focus()
    },
    [fit, terminal],
  )
  useLayoutEffect(
    () => {
      if ((fullscreen || !fullscreen) && terminal.element) {
        handleResizeTerminal()
      }
    },
    [fullscreen, handleResizeTerminal, terminal.element],
  )

  // Integrate terminal and pty processes
  useEffect(
    () => {
      const onDataTerminalDisposable = terminal.onData((data) => {
        ptyProcess.write(data)
      })
      const onDataPTYDisposable = ptyProcess.onData(function(data) {
        terminal.write(data)

        if (isStartAlternateBuffer(data)) {
          updateAlternateBuffer(true)
        }
        if (isEndAlternateBuffer(data)) {
          updateAlternateBuffer(false)
        }
      })

      return () => {
        onDataTerminalDisposable.dispose()
        onDataPTYDisposable.dispose()
      }
    },
    [ptyProcess, terminal, updateAlternateBuffer],
  )

  // Trigger app state refreshes based on terminal changes
  useEffect(
    () => {
      // TODO: this doesn't work well for long-running git processes, as the 'ready' prompt won't trigger a refresh
      // TODO: find a more stable way to trigger terminalChanged after processes exit, perhaps ptyProcess.process ?
      const handleNewLine = debounce(() => {
        getCWD(ptyProcess.pid).then((cwd) => {
          if (!alternateBuffer) {
            dispatch(terminalChanged(cwd))
          }
        })
      }, 300)

      const onKeyDisposable = terminal.onKey((e) => {
        if (e.domEvent.code === 'Enter') {
          handleNewLine()
        }
      })

      return () => {
        onKeyDisposable.dispose()
      }
    },
    [alternateBuffer, dispatch, getCWD, ptyProcess.pid, terminal],
  )

  // Resize terminal based on window size changes
  useEffect(
    () => {
      const handleResize = debounce(handleResizeTerminal, 5)

      window.addEventListener('resize', handleResize, false)

      const onResizeDisposable = terminal.onResize(
        debounce(({ cols, rows }) => {
          ptyProcess.resize(cols, rows)
        }, 5),
      )

      return () => {
        window.removeEventListener('resize', handleResize)
        onResizeDisposable.dispose()
      }
    },
    [handleResizeTerminal, ptyProcess, terminal],
  )

  // Ensure typing always gives focus to the terminal
  useEffect(
    () => {
      const handleNotFocused = () => {
        if (!focused) {
          terminal.focus()
        }
      }

      terminal.textarea.onblur = () => setFocused(false)
      terminal.onfocus = () => setFocused(true)
      window.addEventListener('keydown', handleNotFocused)

      return () => {
        window.removeEventListener('keydown', handleNotFocused)
      }
    },
    [focused, terminal],
  )

  // // TODO: ensure the process can't be exited and restart if need be
  // that.ptyProcess.on('exit', () => {
  //   console.log('recreating')
  //   that.setupXTerm()
  //   that.setupTerminalEvents()
  // })

  return <TerminalContainer ref={container} />
}

Terminal.propTypes = {
  onAlternateBufferChange: PropTypes.func.isRequired,
}

const TerminalContainer = styled.div`
  display: flex;
  flex: 1;
  margin: 5px;
`
