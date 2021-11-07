import path from 'path'
import { app, BrowserWindow, Menu, screen } from 'electron'
import logger from 'electron-log'
import { autoUpdater } from 'electron-updater'
import getMenu from './menu'
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer'

import { startGitWorker } from './git-worker'
import { startSpawnWorker } from './spawn-worker'

import '../sentry'

const isDevelopment = process.env.NODE_ENV === 'development'

// autoUpdater.logger = logger
import * as remote from '@electron/remote/main'
remote.initialize()

let mainWindow: BrowserWindow | null = null
const gitWorker = startGitWorker()
const spawnWorker = startSpawnWorker()
let forceQuit = false

const installExtensions = async () => {
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS

  try {
    logger.log('Installing extensions: Started')
    await installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS], {
      loadExtensionOptions: { allowFileAccess: true },
      forceDownload: forceDownload,
    })
    logger.log('Installing extensions: Done')
  } catch (e: any) {
    logger.warn(`Error installing devtools extension: ${e.message}`)
  }
}

app.allowRendererProcessReuse = false

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', async () => {
  if (isDevelopment) {
    logger.log('Development mode detected, installing dev tools')
    await installExtensions()
  }

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, '../sentry.js'),
      enableRemoteModule: true,
    },
    title: `Giterm ${app.getVersion()}`,
  })

  remote.enable(mainWindow.webContents)

  // Show on currently active screen
  const currentScreen = screen.getDisplayNearestPoint(
    screen.getCursorScreenPoint(),
  )
  mainWindow.setBounds(currentScreen.workArea)

  mainWindow.maximize()

  const html = path.join(__dirname, '../renderer/index.html')
  mainWindow.loadFile(path.resolve(html))

  // show window once on first load
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.on('did-finish-load', () => {
    // Handle window logic properly on macOS:
    // 1. App should not terminate if window has been closed
    // 2. Click on icon in dock should re-open the window
    // 3. ⌘+Q should close the window and quit the app
    if (process.platform === 'darwin') {
      mainWindow!.on('close', function (e) {
        if (!forceQuit) {
          e.preventDefault()
          mainWindow!.hide()
        }
      })

      app.on('activate', () => {
        mainWindow!.show()
      })

      app.on('before-quit', () => {
        forceQuit = true
      })
    } else {
      mainWindow!.on('closed', () => {
        mainWindow = null
        gitWorker.dispose()
        spawnWorker.dispose()
      })
    }
  })

  if (isDevelopment) {
    // auto-open dev tools
    mainWindow.webContents.openDevTools()

    // add inspect element on right click menu
    mainWindow.webContents.on('context-menu', (e, props) => {
      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click() {
            mainWindow!.webContents.inspectElement(props.x, props.y)
          },
        },
      ]).popup()
    })
  }

  Menu.setApplicationMenu(getMenu(mainWindow))

  // Auto-update!

  autoUpdater.on('checking-for-update', () => {
    logger.log('Checking for update...')
  })
  autoUpdater.on('update-available', () => {
    logger.log('Update available.')
  })
  autoUpdater.on('update-not-available', () => {
    logger.log('Update not available.')
  })
  autoUpdater.on('error', (err) => {
    logger.log('Error in auto-updater. ' + err)
  })
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = 'Download speed: ' + progressObj.bytesPerSecond
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
    log_message =
      log_message +
      ' (' +
      progressObj.transferred +
      '/' +
      progressObj.total +
      ')'
    logger.log(log_message)
  })
  autoUpdater.on('update-downloaded', () => {
    logger.log('Update downloaded')
  })

  logger.log('Checking for updates...')
  const result = await autoUpdater.checkForUpdatesAndNotify()
  logger.log('Update result:', result)
})
