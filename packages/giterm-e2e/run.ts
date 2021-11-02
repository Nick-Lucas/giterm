import { getPath } from './spawn'
import { Application, SpectronClient } from 'spectron'
// import { Element } from 'webdriverio'
// import assert from 'assert'
// import packageJson from '../giterm/package.json'
import { TestGitShim } from '../git/src/TestGitShim'

const log = console.info
// const warn = console.warn

const STATUS_SELECTOR = '#StatusBar_Status'
const BRANCH_SELECTOR = '#StatusBar_Branch'
const SHOW_REMOTE_SELECTOR = '#StatusBar_ShowRemote'
const COMMITS_SELECTOR = '#Commits'

const app = new Application({
  path: require('electron'),
  args: [getPath('packages/giterm/init.js')],
  cwd: getPath('packages/giterm/'),
  env: {
    ...process.env,
    NODE_ENV: 'test',
  },
  requireName: 'spectronRequire',
})

async function cmd(wd: SpectronClient, text: string) {
  await wd.keys(text)
  await wd.keys(['Enter'])

  await new Promise((resolve) => setTimeout(resolve, 50))
}

async function start() {
  log('Starting app')
  await app.start()
  await app.client.waitUntilWindowLoaded()
  log('Started app')

  const wd = app.client
  const handles = await wd.getWindowHandles()
  await wd.switchToWindow(handles[0])
  await wd.waitUntilTextExists(SHOW_REMOTE_SELECTOR, 'Show Remote')

  try {
    await testNonGitDirectory(app, wd)
    await testInitialisingGitDirectory(app, wd)
    await testVisitingGitDirectory(app, wd)

    log('OK!')
    await app.stop()
    process.exit(0)
  } catch (err) {
    console.error(err)

    await app.stop()
    process.exit(1)
  }
}

async function testNonGitDirectory(app: Application, wd: SpectronClient) {
  console.log('Test that Non-Git Directory is displayed correctly')

  const git = new TestGitShim()
  await cmd(wd, 'cd ' + git.dir)

  await wd.waitUntilTextExists(STATUS_SELECTOR, 'No Repository')
  await wd.waitUntilTextExists(BRANCH_SELECTOR, 'No Branch')
}

async function testInitialisingGitDirectory(
  app: Application,
  wd: SpectronClient,
) {
  console.log('Test that creating a new repository is reflected properly')

  const git = new TestGitShim()

  await cmd(wd, 'cd ' + git.dir)
  await cmd(wd, 'git init')
  await cmd(wd, 'git checkout -b dev/main')

  await wd.waitUntilTextExists(STATUS_SELECTOR, 'OK')
  await wd.waitUntilTextExists(BRANCH_SELECTOR, 'dev/main')
}

async function testVisitingGitDirectory(app: Application, wd: SpectronClient) {
  console.log(
    'Test that visiting a directory and creating a commit is reflected',
  )

  const git = new TestGitShim()

  await cmd(wd, 'cd ' + git.dir)
  await cmd(wd, 'git init')
  git.writeFile('file1', 'abc')
  await cmd(wd, 'git checkout -b dev/main')
  await cmd(wd, 'git add --all')
  await cmd(wd, 'git commit -m "Initial Test Commit"')

  await wd.waitUntilTextExists(STATUS_SELECTOR, 'OK')
  await wd.waitUntilTextExists(BRANCH_SELECTOR, 'dev/main')

  await wd.waitUntilTextExists(COMMITS_SELECTOR, 'dev/main')
  await wd.waitUntilTextExists(COMMITS_SELECTOR, 'Initial Test Commit')
}

start()
