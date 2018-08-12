import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import styled, { css } from 'styled-components'

import Commits from '../components/commits'
import Terminal from '../components/terminal'
import { refreshApplication } from '../store/coreapp'
import { bindServices } from '../lib/di'

const CommitsWrapper = styled.div`
  flex: 1;
  display: inline-grid;

  ${(props) =>
    props.hide &&
    css`
      display: none;
    `};
`
const TerminalWrapper = styled.div`
  height: 30vh;
  min-height: 100px
  display: flex;

  ${(props) =>
    props.fullscreen &&
    css`
      background-color: #001825;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      height: 99.5%;
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
    const { refreshApplication, gitService } = this.props
    refreshApplication(gitService)
  }

  render() {
    const { terminalFullscreen } = this.props
    return (
      <React.Fragment>
        <CommitsWrapper hide={terminalFullscreen}>
          <Commits />
        </CommitsWrapper>
        <Divider hide={terminalFullscreen} />
        <TerminalWrapper fullscreen={terminalFullscreen}>
          <Terminal />
        </TerminalWrapper>
      </React.Fragment>
    )
  }
}

const ConnectedHome = connect(
  ({ config: { terminalFullscreen } }) => ({ terminalFullscreen }),
  { refreshApplication },
)(Home)

export default bindServices(({ git }) => ({ gitService: git }))(ConnectedHome)
