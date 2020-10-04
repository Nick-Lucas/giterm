import React from 'react'

import { Menu } from 'app/lib/primitives'
import { LowerPanelExpandCollapseMenuItem } from './LowerPanelExpandCollapseMenuItem'
import { LowerPanelSwitchViewMenuItem } from './LowerPanelSwitchViewMenuItem'

export function LowerPanelMenu({ children, ...props }) {
  return (
    <Menu.Show {...props}>
      <LowerPanelExpandCollapseMenuItem />
      <LowerPanelSwitchViewMenuItem />

      {children}
    </Menu.Show>
  )
}
