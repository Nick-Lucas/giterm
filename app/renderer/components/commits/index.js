import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import Table from './table'
import { data } from './props'

const columns = [
  { name: 'SHA', key: 'sha7', width: '5em' },
  { name: 'Message', key: 'message', width: '40em' },
  { name: 'Date', key: 'dateStr', width: '6em' },
]

export class Commits extends Component {
  static propTypes = {
    commits: data,
  }

  render() {
    const { commits } = this.props
    console.log(commits)

    return <Table columns={columns} data={commits || []} />
  }
}

export default connect(
  ({ commits }) => ({ commits }),
  {},
)(Commits)
