import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

export class Commits extends Component {
  static propTypes = {
    commits: PropTypes.arrayOf(
      PropTypes.shape({
        sha: PropTypes.string.isRequired,
        // parents: PropTypes.arrayOf(PropTypes.string).isRequired,
        // message: PropTypes.string,
        // author: PropTypes.string,
        // authorEmail: PropTypes.string,
        // date: PropTypes.any,
      }),
    ),
  }

  render() {
    const { commits } = this.props
    console.log(commits)

    return (
      <div>
        {commits.map((commit) => <div key={commit.sha}>{commit.sha}</div>)}
      </div>
    )
  }
}

export default connect(
  ({ gitGraph }) => ({ commits: gitGraph }),
  {},
)(Commits)
