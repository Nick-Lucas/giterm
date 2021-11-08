import fs from 'fs'
import path from 'path'
import { NODE_ENV } from 'app/lib/env'

let bashPath = ''
if (NODE_ENV === 'production') {
  bashPath = path.resolve(process.resourcesPath, 'bashrc')
} else {
  bashPath = path.resolve(__dirname, './bashrc')
}

export const BASHRC_PATH = bashPath
if (!fs.existsSync(BASHRC_PATH)) {
  // TODO: ensure that packaging process includes this properly
  throw `bashrc not found: ${BASHRC_PATH}`
}
