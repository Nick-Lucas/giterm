import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import Table from './table'
import { data } from './props'

export class Commits extends Component {
  static propTypes = {
    commits: data,
  }

  render() {
    const { commits } = this.props
    console.log(commits)

    return (
      <Table
        columns={[
          { name: 'SHA', key: 'sha7', width: '5em' },
          { name: 'Message', key: 'message', width: '40em' },
        ]}
        data={commits || []}
      />
    )
  }
}

export default connect(
  ({ commits }) => ({ commits }),
  {},
)(Commits)
