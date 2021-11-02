import { getPath } from './spawn'
import { Application } from 'spectron'
import assert from 'assert'
import packageJson from '../giterm/package.json'

const log = console.info
// const warn = console.warn

const app = new Application({
  path: require('electron'),
  args: [getPath('packages/giterm/init.js')],
  cwd: getPath('packages/giterm/'),
  env: {
    ...process.env,
    NODE_ENV: 'test',
  },
})

async function start() {
  log('Starting app')
  await app.start()
  log('Started app')

  const title = await app.browserWindow.getTitle()
  assert(title.startsWith('Giterm - ' + packageJson.version))
}

start()
