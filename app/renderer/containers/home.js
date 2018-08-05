import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import Commits from '../components/commits'
import { loadCommits } from '../store/commits'

export class Home extends PureComponent {
  componentDidMount() {
    this.props.loadCommits()
  }

  render() {
    return (
      <div>
        <Commits />
      </div>
    )
  }
}

export default connect(
  null,
  { loadCommits },
)(Home)
