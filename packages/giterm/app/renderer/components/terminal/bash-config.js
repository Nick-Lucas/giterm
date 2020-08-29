import fs from 'fs'
import path from 'path'
import { remote } from 'electron'

let bashPath = ''
if (process.env.NODE_ENV === 'development') {
  bashPath = path.resolve(__dirname, './bashrc')
} else {
  const path =
    process.platform === 'darwin'
      ? '../../Resources/bashrc'
      : '../../resources/bashrc'
  bashPath = path.resolve(remote.app.getPath('exe'), path)
}

export const BASHRC_PATH = bashPath
if (!fs.existsSync(BASHRC_PATH)) {
  // TODO: ensure that packaging process includes this properly
  throw `bashrc not found: ${BASHRC_PATH}`
}
