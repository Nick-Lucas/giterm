// https://electronjs.org/docs/api/menu-item#roles

import { Menu, BrowserWindow } from 'electron'

// NOTE
// Accelerators don't work from menu when focus is within xterm.js
// so functionality is handled within app.js as a result
export default function menu(mainWindow: BrowserWindow) {
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
      label: 'Diff',
      submenu: [
        {
          label: 'Toggle Diff mode',
          accelerator: 'Control+i',
          click() {
            // app.js
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Remote Data',
          accelerator: 'Control+R',
          click() {
            // app.js
          },
        },
        {
          label: 'Toggle Diff View',
          accelerator: 'Control+1',
          click() {
            // app.js
          },
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'togglefullscreen' },
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
