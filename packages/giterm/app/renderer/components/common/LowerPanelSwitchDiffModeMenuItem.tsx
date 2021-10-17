import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'app/store'

import { Pause, Square } from 'react-feather'
import { diffToggleDiffMode } from 'app/store/diff/actions'

import { Menu } from 'app/lib/primitives'

export function LowerPanelSwitchDiffModeMenuItem() {
  const dispatch = useDispatch()
  const { diffMode } = useSelector((state) => state.diff)

  const handleUserToggle = useCallback(() => {
    dispatch(diffToggleDiffMode())
  }, [dispatch])

  return (
    <Menu.Item
      title={
        diffMode === 'split' ? 'Inline Diff (ctl+i)' : 'Split Diff (ctl+i)'
      }
      onClick={handleUserToggle}>
      {diffMode === 'inline' && <Square size={20} />}
      {diffMode === 'split' && <Pause size={20} />}
    </Menu.Item>
  )
}
