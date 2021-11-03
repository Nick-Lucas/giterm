import { getPath } from './spawn'
import { Application, SpectronClient } from 'spectron'
// import { Element } from 'webdriverio'
// import assert from 'assert'
// import packageJson from '../giterm/package.json'
import { TestGitShim } from '../git/src/TestGitShim'

const STATUS_SELECTOR = '#StatusBar_Status'
const BRANCH_SELECTOR = '#StatusBar_Branch'
const SHOW_REMOTE_SELECTOR = '#StatusBar_ShowRemote'
const COMMITS_SELECTOR = '#Commits'

describe('giterm', () => {
  let app: Application
  let wd: SpectronClient

  async function cmd(text: string) {
    await wd.keys(text)
    await wd.keys(['Enter'])

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  beforeEach(async () => {
    app = new Application({
      path: require('electron'),
      args: [getPath('packages/giterm/init.js')],
      cwd: getPath('packages/giterm/'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
      requireName: 'spectronRequire',
    })

    await app.start()
    wd = app.client

    await wd.waitUntilWindowLoaded()

    const handles = await wd.getWindowHandles()
    await wd.switchToWindow(handles[0])
    await wd.waitUntilTextExists(SHOW_REMOTE_SELECTOR, 'Show Remote')
  })

  afterEach(async () => {
    app.stop()
    ;(app as any) = null
  })

  it('shows a non-git directory', async () => {
    const git = new TestGitShim()
    await cmd('cd ' + git.dir)

    await wd.waitUntilTextExists(STATUS_SELECTOR, 'No Repository')
    await wd.waitUntilTextExists(BRANCH_SELECTOR, 'No Branch')
  })
})
