import React from 'react'

import { Menu } from 'app/lib/primitives'
import { LowerPanelExpandCollapseMenuItem } from './LowerPanelExpandCollapseMenuItem'
import { LowerPanelSwitchViewMenuItem } from './LowerPanelSwitchViewMenuItem'

export function LowerPanelMenu({ children = null, ...props }) {
  return (
    <Menu.Show {...props}>
      {children}
      <LowerPanelSwitchViewMenuItem />
      <LowerPanelExpandCollapseMenuItem />
    </Menu.Show>
  )
}
