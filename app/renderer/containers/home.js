import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import styled, { css } from 'styled-components'

import Commits from '../components/commits'
import Terminal from '../components/terminal'
import { refresh } from '../store/core/actions'
import { StatusBar } from '../components/StatusBar'

const FullscreenWrapper = styled.div`
  display: flex;
  position: relative;
  flex: 1;
  flex-direction: column;
  max-width: 100%;
`

const CommitsWrapper = styled.div`
  display: flex;
  flex: 1;

  ${(props) =>
    props.hide &&
    css`
      display: none;
    `};
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
  width: 100%;
  border-width: 0.5px;
  border-color: gray;
  margin: 0;

  ${(props) =>
    props.hide &&
    css`
      display: none;
    `};
`

export class Home extends PureComponent {
  componentDidMount() {
    const { refresh } = this.props
    refresh()
  }

  render() {
    const { terminalFullscreen } = this.props
    return (
      <React.Fragment>
        <StatusBar />
        <Divider />
        <FullscreenWrapper>
          <CommitsWrapper hide={terminalFullscreen}>
            <Commits />
          </CommitsWrapper>
          <Divider hide={terminalFullscreen} />
          <TerminalWrapper fullscreen={terminalFullscreen}>
            <Terminal />
          </TerminalWrapper>
        </FullscreenWrapper>
      </React.Fragment>
    )
  }
}

export default connect(
  ({ terminal: { fullscreen } }) => ({ terminalFullscreen: fullscreen }),
  { refresh },
)(Home)
