import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'

import Commits from '../components/commits'
import Terminal from '../components/terminal'
import { refreshApplication } from '../store/coreapp'
import { bindServices } from '../lib/di'

const CommitsWrapper = styled.div`
  flex: 1;
  display: inline-grid;
`
const TerminalWrapper = styled.div`
  height: 30vh;
  min-height: 100px
  display: flex;
`

const Divider = styled.hr`
  width: 100%;
  border-width: 0.5px;
  border-color: gray;
  margin: 0;
`

export class Home extends PureComponent {
  componentDidMount() {
    const { refreshApplication, gitService } = this.props
    refreshApplication(gitService)
  }

  render() {
    return (
      <React.Fragment>
        <CommitsWrapper>
          <Commits />
        </CommitsWrapper>
        <Divider />
        <TerminalWrapper>
          <Terminal />
        </TerminalWrapper>
      </React.Fragment>
    )
  }
}

const ConnectedHome = connect(
  null,
  { refreshApplication },
)(Home)

export default bindServices(({ git }) => ({ gitService: git }))(ConnectedHome)
