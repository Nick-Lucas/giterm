import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Terminal } from 'react-feather'
import { diffToggleShow } from 'app/store/diff/actions'

import { Menu, icons } from 'app/lib/primitives'

export function LowerPanelSwitchViewMenuItem() {
  const dispatch = useDispatch()
  const { show } = useSelector((state) => state.diff)

  const handleUserToggle = useCallback(() => {
    dispatch(diffToggleShow())
  }, [dispatch])

  return (
    <Menu.Item
      title={show ? 'Show Terminal (ctl+1)' : 'Show Diff (ctl+1)'}
      onClick={handleUserToggle}>
      {show ? <Terminal size={20} /> : <icons.FileDiff size={20} />}
    </Menu.Item>
  )
}
