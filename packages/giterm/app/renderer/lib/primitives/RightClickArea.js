import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'

export function RightClickArea({
  onClick,
  onDoubleClick,
  menuItems,
  ...props
}) {
  const handleContextMenu = useCallback(() => {
    const builtMenu = remote.Menu.buildFromTemplate(menuItems)
    builtMenu.popup(remote.getCurrentWindow())
  }, [menuItems])

  return (
    <div
      {...props}
      onContextMenu={handleContextMenu}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    />
  )
}

RightClickArea.propTypes = {
  children: PropTypes.node.isRequired,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      click: PropTypes.func.isRequired,
    }),
  ).isRequired,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
}
