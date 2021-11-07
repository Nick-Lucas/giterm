import { getPath } from './spawn'
import { Application, SpectronClient } from 'spectron'
import { TestGitShim } from '../git/src/TestGitShim'
import { GuiValidator } from './GuiValidator'
import { Git } from '@giterm/git'

describe('giterm', () => {
  let app: Application
  let wd: SpectronClient
  let validate: GuiValidator

  async function cmd(text: string) {
    await wd.keys(text)
    await wd.keys(['Enter'])

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  async function gitInit(dir: string) {
    await cmd('git init')

    return await new Git(dir).getHeadBranch()
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
      chromeDriverArgs: ['--disable-dev-shm-usage', '--no-sandbox'],
    })

    await app.start()
    wd = app.client
    validate = new GuiValidator(wd)

    await wd.waitUntilWindowLoaded()

    const handles = await wd.getWindowHandles()
    await wd.switchToWindow(handles[0])
    await validate.loaded()
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

    await validate.screen({
      status: 'No Repository',
      currentBranch: {
        name: 'No Branch',
        remote: {
          hasRemote: true,
          ahead: 0,
          behind: 0,
        },
      },
      branches: [],
      commits: 0,
      commitChecks: [],
    })
  })

  it('initialises a git directory with no commits', async () => {
    const git = new TestGitShim()

    await cmd('cd ' + git.dir)
    const branchName = await gitInit(git.dir)

    await validate.screen({
      status: 'OK',
      currentBranch: {
        name: branchName,
        remote: {
          hasRemote: true,
          ahead: 0,
          behind: 0,
        },
      },
      branches: [],
      commits: 0,
      commitChecks: [],
    })
  })

  it('initialises a git directory and creates one commit', async () => {
    const git = new TestGitShim()

    // Initialise repo
    await cmd('cd ' + git.dir)
    const branchName = await gitInit(git.dir)
    git.writeFile('file1', 'abc')
    await cmd('git add --all')
    await cmd('git commit -m "Initial Test Commit"')

    await validate.screen({
      status: 'OK',
      currentBranch: {
        name: branchName,
      },
      branches: [
        {
          name: branchName,
        },
      ],
      commits: 1,
      commitChecks: [
        {
          index: 0,
          message: 'Initial Test Commit',
          refs: [
            {
              type: 'branch',
              name: branchName,
            },
          ],
        },
      ],
    })
  })

  it('loads a git directory with a remote', async () => {
    const git = new TestGitShim()

    // Initialise repo
    await cmd('cd ' + git.dir)
    const branchName = await gitInit(git.dir)
    git.writeFile('file1', 'abc')
    await git.commit('Initial Test Commit')

    // Initialise remote
    const remoteDir = await git.createRemote()
    await cmd(`git remote add origin "${remoteDir}"`)
    await cmd(`git push --set-upstream origin ${branchName}`)

    await validate.screen({
      status: 'OK',
      currentBranch: {
        name: branchName,
        remote: {
          hasRemote: true,
          ahead: 0,
          behind: 0,
        },
      },
      branches: [
        {
          name: branchName,
          remote: {
            hasRemote: true,
            ahead: 0,
            behind: 0,
          },
        },
      ],
      commits: 1,
      commitChecks: [
        {
          index: 0,
          message: 'Initial Test Commit',
          refs: [
            {
              type: 'branch',
              name: branchName,
              remote: { hasRemote: true, ahead: 0, behind: 0 },
            },
          ],
        },
      ],
    })
  })
})
