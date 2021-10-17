import { remote } from '@electron/remote'

const appName = remote.app.getName()
const appVersion = remote.app.getVersion()

const defaultTitle: string = `${appName} - ${appVersion}`

export const resetWindowTitle = () => {
  document.title = defaultTitle
}

export const setWindowTitle = (title: string) => {
  document.title = `${appName} - ${title}`

  return resetWindowTitle
}
