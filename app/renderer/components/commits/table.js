import React from 'react'
import PropTypes from 'prop-types'
import RightClickArea from 'react-electron-contextmenu'
import { clipboard } from 'electron'

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

  getMenuItems = (item) => [
    {
      label: 'Copy SHA',
      click: () => clipboard.writeText(item.sha),
    },
  ]

  render() {
    const { columns, data } = this.props
    const { selectedSHA } = this.state

    return (
      <div>
        <Header columns={columns} />
        {data.map((row) => (
          <RightClickArea key={row.sha} menuItems={this.getMenuItems(row)}>
            <Row
              item={row}
              columns={columns}
              selected={selectedSHA === row.sha}
              onSelect={this.handleSelect}
            />
          </RightClickArea>
        ))}
      </div>
    )
  }
}

Table.propTypes = {
  columns,
  data,
}
