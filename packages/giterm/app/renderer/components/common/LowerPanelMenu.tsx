import React from 'react'
import { useSelector } from 'react-redux'

import { Menu } from 'app/lib/primitives'
import { LowerPanelExpandCollapseMenuItem } from './LowerPanelExpandCollapseMenuItem'
import { LowerPanelSwitchViewMenuItem } from './LowerPanelSwitchViewMenuItem'
import { LowerPanelSwitchDiffModeMenuItem } from './LowerPanelSwitchDiffModeMenuItem'

import { Store } from 'app/store/reducers.types'

export function LowerPanelMenu({ children = null, ...props }) {
  const diff = useSelector<Store, Store['diff']>((state) => state.diff)

  return (
    <Menu.Show {...props}>
      {children}
      {diff.show && <LowerPanelSwitchDiffModeMenuItem />}

      {diff.show && <Menu.Divider />}

      <LowerPanelSwitchViewMenuItem />
      <LowerPanelExpandCollapseMenuItem />
    </Menu.Show>
  )
}
