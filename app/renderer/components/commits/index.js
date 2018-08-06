import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import Table from './table'
import { data, branches } from './props'

const columns = [
  { name: 'SHA', key: 'sha7', width: '5em' },
  { name: 'Message', key: 'message', width: '40em', showTags: true },
  { name: 'Author', key: 'authorStr', width: '8em' },
  { name: 'Date', key: 'dateStr', width: '8em' },
]

export class Commits extends Component {
  static propTypes = {
    commits: data,
    branches,
  }

  render() {
    const { commits, branches } = this.props
    return <Table columns={columns} branches={branches} data={commits || []} />
  }
}

export default connect(
  ({ commits, branches }) => ({ commits, branches }),
  {},
)(Commits)
