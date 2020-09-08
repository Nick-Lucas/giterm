const { func } = require('prop-types')
import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'

export function RightClickArea({ menuItems, ...props }) {
  const handleContextMenu = useCallback(() => {
    const builtMenu = remote.Menu.buildFromTemplate(menuItems)
    builtMenu.popup(remote.getCurrentWindow())
  }, [menuItems])

  return <div {...props} onContextMenu={handleContextMenu} />
}

RightClickArea.propTypes = {
  children: PropTypes.node.isRequired,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      click: PropTypes.func.isRequired,
    }),
  ).isRequired,
}
