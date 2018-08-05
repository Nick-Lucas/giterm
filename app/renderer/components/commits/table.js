import React from 'react'
import PropTypes from 'prop-types'

import { columns, data } from './props'
import Header from './header'
import Row from './row'

export default class Table extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedSHA: '',
    }
  }

  handleSelect = (item) => {
    this.setState({ selectedSHA: item.sha })
  }

  render() {
    const { columns, data } = this.props
    const { selectedSHA } = this.state

    return (
      <div>
        <Header columns={columns} />
        {data.map((row) => (
          <Row
            key={row.sha}
            item={row}
            columns={columns}
            selected={selectedSHA === row.sha}
            onSelect={this.handleSelect}
          />
        ))}
      </div>
    )
  }
}

Table.propTypes = {
  columns,
  data,
}
