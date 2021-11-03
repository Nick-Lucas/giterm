import { getPath } from './spawn'
import { Application, SpectronClient } from 'spectron'
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
        E2E: '1',
      },
      requireName: 'spectronRequire',
      chromeDriverLogPath: getPath('packages/giterm-e2e/.chromedriver.logs'),
    })

    await app.start()
    wd = app.client

    await wd.waitUntilWindowLoaded()

    const handles = await wd.getWindowHandles()
    await wd.switchToWindow(handles[0])
    await wd.waitUntilTextExists(SHOW_REMOTE_SELECTOR, 'Show Remote')
  })

  afterEach(async () => {
    if (app.isRunning()) {
      await app.stop()
    }

    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;(app as any) = null
  })

  it('shows a non-git directory', async () => {
    const git = new TestGitShim()
    await cmd('cd ' + git.dir)

    await wd.waitUntilTextExists(STATUS_SELECTOR, 'No Repository')
    await wd.waitUntilTextExists(BRANCH_SELECTOR, 'No Branch')
  })

  it('initialises a git directory with no commits', async () => {
    const git = new TestGitShim()

    await cmd('cd ' + git.dir)
    await cmd('git init')
    await cmd('git checkout -b dev/main')

    await wd.waitUntilTextExists(STATUS_SELECTOR, 'OK')
    await wd.waitUntilTextExists(BRANCH_SELECTOR, 'dev/main')
  })

  it('initialises a git directory and creates one commit', async () => {
    const git = new TestGitShim()

    await cmd('cd ' + git.dir)
    await cmd('git init')
    git.writeFile('file1', 'abc')
    await cmd('git checkout -b dev/main')
    await cmd('git add --all')
    await cmd('git commit -m "Initial Test Commit"')

    await wd.waitUntilTextExists(STATUS_SELECTOR, 'OK')
    await wd.waitUntilTextExists(BRANCH_SELECTOR, 'dev/main')

    await wd.waitUntilTextExists(COMMITS_SELECTOR, 'dev/main')
    await wd.waitUntilTextExists(COMMITS_SELECTOR, 'Initial Test Commit')
  })

  it.todo('loads a git directory with a remote')
  it.todo('loads a git directory with a remote')
})
