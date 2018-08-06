import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'

import { loadCommits } from '../store/commits'
import { doStatusUpdate } from '../store/status'
import { doUpdateBranches } from '../store/branches'
import Commits from '../components/commits'
import Terminal from '../components/terminal'

const CommitsWrapper = styled.div`
  flex: 1;
  display: inline-grid;
`
const TerminalWrapper = styled.div`
  height: 15em;
  display: flex;
`

const Divider = styled.hr`
  width: 100%;
  border-width: 0.5px;
  border-color: gray;
`

export class Home extends PureComponent {
  componentDidMount() {
    this.props.loadCommits()
    this.props.doStatusUpdate()
    this.props.doUpdateBranches()
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
  { loadCommits, doStatusUpdate, doUpdateBranches },
)(Home)
