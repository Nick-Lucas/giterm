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
import _ from 'lodash'

import * as XTerm from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { spawn } from 'node-pty'
import { shell } from 'electron'

import { terminalChanged } from 'app/store/terminal/actions'
import { INITIAL_CWD } from 'app/lib/cwd'
import { BASHRC_PATH } from './bash-config'
import { getCWD } from './getCWD'

const terminalOpts = {
  allowTransparency: true,
  fontFamily: 'Inconsolata, monospace',
  fontSize: 16,
  theme: {
    background: 'rgba(255, 255, 255, 0)',
  },
  cursorStyle: 'bar',
}

export function Terminal({ isShown = true, onAlternateBufferChange }) {
  const dispatch = useDispatch()
  const container = useRef()

  const cwd = useSelector((state) => state.config.cwd) || INITIAL_CWD
  const cwdStaticRef = useRef(cwd)

  const { fullscreen } = useSelector((state) => state.terminal)

  const [alternateBuffer, setAlternateBuffer] = useState(false)
  const [focused, setFocused] = useState(false)

  //
  // PTY Instance

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

  //
  // Terminal Instance

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

  useEffect(() => {
    terminal.open(container.current)
  }, [terminal])

  //
  // Resize Events

  const handleResizeTerminal = useCallback(() => {
    if (!isShown) return

    terminal.resize(10, 10)
    fit.fit()
    terminal.focus()
  }, [fit, isShown, terminal])

  useLayoutEffect(() => {
    setTimeout(() => {
      handleResizeTerminal()
    }, 0)
  }, [fullscreen, handleResizeTerminal, isShown, terminal.element])

  useEffect(() => {
    const handleResize = _.debounce(handleResizeTerminal, 5)

    window.addEventListener('resize', handleResize, false)
    window.addEventListener('transitionend', handleResize, false)

    const onResizeDisposable = terminal.onResize(
      _.throttle(({ cols, rows }) => {
        ptyProcess.resize(cols, rows)
      }, 5),
    )

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('transitionend', handleResize)
      onResizeDisposable.dispose()
    }
  }, [handleResizeTerminal, ptyProcess, terminal])

  //
  // Integrate Terminal and PTY

  useEffect(() => {
    const updateAlternateBuffer = _.debounce((active) => {
      // ensure xterm has a few moments to trigger its
      // own re-render before we trigger a resize
      setTimeout(() => {
        setAlternateBuffer(active)
        onAlternateBufferChange(active)
      }, 5)
    }, 5)

    const onDataTerminalDisposable = terminal.onData((data) => {
      ptyProcess.write(data)
    })

    const onDataPTYDisposable = ptyProcess.onData(function(data) {
      terminal.write(data)
    })

    const bufferChangeDetector = terminal.buffer.onBufferChange((buffer) => {
      updateAlternateBuffer(buffer.type == 'alternate')
    })

    return () => {
      onDataTerminalDisposable.dispose()
      onDataPTYDisposable.dispose()
      bufferChangeDetector.dispose()
    }
  }, [onAlternateBufferChange, ptyProcess, terminal])

  // // TODO: ensure the process can't be exited and restart if need be
  // that.ptyProcess.on('exit', () => {
  //   console.log('recreating')
  //   that.setupXTerm()
  //   that.setupTerminalEvents()
  // })

  //
  // Observe CWD and Other state

  // Trigger app state refreshes based on terminal changes
  useEffect(() => {
    const handleTerminalUpdates = _.debounce(
      async () => {
        if (alternateBuffer) {
          // State won't change while in VI
          // Actually the user might be lost in there forever...
          return
        }

        const cwd = await getCWD(ptyProcess.pid)
        dispatch(terminalChanged(cwd))
      },
      150,
      { leading: true, trailing: true },
    )

    // Refresh immediately after input
    const onNewLineDisposable = terminal.onKey(async (e) => {
      if (e.domEvent.code === 'Enter') {
        await handleTerminalUpdates()
      }
    })

    // Refresh after new lines received
    const onLineFeedDisposable = terminal.onLineFeed(async () => {
      await handleTerminalUpdates()
    })

    // Refresh after long running processes finish
    let lastProcess = ptyProcess.process
    const onProcessChangedDisposable = ptyProcess.onData(async () => {
      const processChanged = lastProcess !== ptyProcess.process
      if (processChanged) {
        lastProcess = ptyProcess.process
        await handleTerminalUpdates()
      }
    })

    return () => {
      onNewLineDisposable.dispose()
      onProcessChangedDisposable.dispose()
      onLineFeedDisposable.dispose()
    }
  }, [alternateBuffer, dispatch, ptyProcess, ptyProcess.pid, terminal])

  //
  // Autofocus Terminal on keys

  useEffect(() => {
    if (!isShown) return

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
  }, [focused, isShown, terminal])

  return <TerminalContainer ref={container} />
}

Terminal.propTypes = {
  onAlternateBufferChange: PropTypes.func.isRequired,
  isShown: PropTypes.bool,
}

const TerminalContainer = styled.div`
  display: flex;
  flex: 1;
  margin: 5px;
`
