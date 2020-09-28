import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled, { css } from 'styled-components'

import { Commits } from 'app/components/commits'
import Terminal from 'app/components/terminal'
import { Diff } from 'app/components/diff'
import { StatusBar } from 'app/components/StatusBar'
import { init } from 'app/store/core/actions'
import * as Sidebar from 'app/components/sidebar'

export function Home() {
  const terminalFullscreen = useSelector((state) => state.terminal.fullscreen)

  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(init())
  }, [dispatch])

  const diff = useSelector((state) => state.diff)

  return (
    <>
      <StatusBar />

      <Divider />

      <FullscreenWrapper>
        <PlaygroundWrapper hide={terminalFullscreen}>
          <PlaygroundColumn width="15">
            <PlaygroundColumnScroller>
              <Sidebar.Changes />
              <Sidebar.Branches />
              <Sidebar.Tags />
              <Sidebar.Remotes />
            </PlaygroundColumnScroller>
          </PlaygroundColumn>

          <Divider />

          <PlaygroundColumn>
            <Commits />
          </PlaygroundColumn>
        </PlaygroundWrapper>

        <Divider hide={terminalFullscreen} />

        <TerminalWrapper fullscreen={terminalFullscreen}>
          {!diff.show && <Terminal />}
          {diff.show && (
            <Diff
              mode={diff.mode}
              shaNew={diff.shas[0]}
              shaOld={diff.shas[1]}
            />
          )}
        </TerminalWrapper>
      </FullscreenWrapper>
    </>
  )
}

const FullscreenWrapper = styled.div`
  display: flex;
  position: relative;
  flex: 1;
  flex-direction: column;
  max-width: 100%;
  overflow: hidden;
`

const PlaygroundWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;

  max-width: 100%;
  overflow: scroll;

  ${(props) =>
    props.hide &&
    css`
      display: none;
    `};
`

const PlaygroundColumn = styled.div`
  display: flex;
  flex: 1;
  position: relative;

  ${(props) =>
    props.width != null &&
    css`
      min-width: ${props.width}rem;
      max-width: ${props.width}rem;
      overflow-x: hidden;
      overflow-y: scroll;
    `};
`

const PlaygroundColumnScroller = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;

  position: absolute;

  min-width: 100%;
  max-width: 100%;
  min-height: 100%;

  padding-bottom: 1rem;
`

const TerminalWrapper = styled.div`
  display: flex;
  height: 30%;
  min-height: 100px;

  ${(props) =>
    props.fullscreen &&
    css`
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      height: 100%;
    `};
`

const Divider = styled.hr`
  border-width: 1px;
  border-color: gray;
  margin: 0;

  ${(props) =>
    props.hide &&
    css`
      display: none;
    `};
`
