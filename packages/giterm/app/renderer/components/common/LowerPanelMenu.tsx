import React from 'react'
import { useSelector } from 'app/store'

import { Menu } from 'app/lib/primitives'
import { LowerPanelExpandCollapseMenuItem } from './LowerPanelExpandCollapseMenuItem'
import { LowerPanelSwitchViewMenuItem } from './LowerPanelSwitchViewMenuItem'
import { LowerPanelSwitchDiffModeMenuItem } from './LowerPanelSwitchDiffModeMenuItem'

export function LowerPanelMenu({ children = null, ...props }) {
  const diff = useSelector((state) => state.diff)

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
