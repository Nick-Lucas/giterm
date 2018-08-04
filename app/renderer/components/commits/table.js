import React from 'react'
import PropTypes from 'prop-types'

import { columns, data } from './props'
import Header from './header'
import Row from './row'

export default class Table extends React.Component {
  render() {
    const { columns, data } = this.props

    return (
      <div>
        <Header columns={columns} />
        {data.map((row) => <Row key={row.sha} item={row} columns={columns} />)}
      </div>
    )
  }
}

Table.propTypes = {
  columns,
  data,
}
