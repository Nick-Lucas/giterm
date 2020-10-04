import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Terminal, FileText } from 'react-feather'
import { diffToggleShow } from 'app/store/diff/actions'

import { Menu } from 'app/lib/primitives'

export function LowerPanelSwitchViewMenuItem() {
  const dispatch = useDispatch()
  const { show } = useSelector((state) => state.diff)

  const handleUserToggle = useCallback(() => {
    dispatch(diffToggleShow())
  }, [dispatch])

  return (
    <Menu.Item
      title={show ? 'Show Terminal (ctl+d)' : 'Show Diff (ctl+d)'}
      onClick={handleUserToggle}>
      {show ? <Terminal size={20} /> : <FileText size={20} />}
    </Menu.Item>
  )
}
