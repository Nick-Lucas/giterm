import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'app/store'

import { Minimize, Maximize } from 'react-feather'
import { flipUserTerminalFullscreen } from 'app/store/terminal/actions'

import { Menu } from 'app/lib/primitives'

export function LowerPanelExpandCollapseMenuItem() {
  const dispatch = useDispatch()
  const { fullscreen } = useSelector((state) => state.terminal)

  const handleUserToggle = useCallback(() => {
    dispatch(flipUserTerminalFullscreen())
  }, [dispatch])

  return (
    <Menu.Item
      title={fullscreen ? 'Minimise (ctl+tab)' : 'Maximise (ctl+tab)'}
      onClick={handleUserToggle}>
      {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
    </Menu.Item>
  )
}
