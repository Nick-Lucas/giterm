import { BrowserWindow } from 'electron'
import path from 'path'

export const createGitWorker = async (): Promise<BrowserWindow> => {
  const gitWorker = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      preload: path.join(__dirname, '../sentry.js'),
      webgl: false,
      backgroundThrottling: false,
      enableWebSQL: false,
      images: false,
    },
    title: `Giterm Git Worker`,
  })

  const html = path.join(__dirname, '../renderer-git-worker/index.html')
  gitWorker.loadFile(path.resolve(html))

  return new Promise((resolve) => {
    gitWorker.on('ready-to-show', () => {
      resolve(gitWorker)
    })
  })
}
