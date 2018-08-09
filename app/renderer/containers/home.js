import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'

import Commits from '../components/commits'
import Terminal from '../components/terminal'
import { refreshApplication } from '../store/coreapp'

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
    this.props.refreshApplication()
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

export default connect(
  null,
  { refreshApplication },
)(Home)
