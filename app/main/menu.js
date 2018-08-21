// https://electronjs.org/docs/api/menu-item#roles

import { Menu } from 'electron'

// NOTE
// Accelerators don't work from menu when focus is within xterm.js
// so functionality is handled within app.js as a result
export default function menu(mainWindow) {
  return Menu.buildFromTemplate([
    {
      label: 'Giterm',
      submenu: [{ role: 'minimize' }, { type: 'separator' }, { role: 'quit' }],
    },
    {
      label: 'Terminal',
      submenu: [
        {
          role: 'copy',
        },
        {
          role: 'paste',
        },
        { type: 'separator' },
        {
          label: 'Expand Terminal',
          accelerator: 'Control+Tab',
          click() {
            // app.js
          },
        },
      ],
    },
    {
      label: 'Git',
      submenu: [
        {
          label: 'Toggle Remote Data',
          accelerator: 'Control+R',
          click() {
            // app.js
          },
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'toggleFullScreen' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        {
          label: 'Open Dev Tools',
          click() {
            mainWindow.webContents.openDevTools()
          },
          accelerator: 'CommandOrControl+Shift+I',
        },
      ],
    },
  ])
}
