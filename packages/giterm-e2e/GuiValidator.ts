import { SpectronClient } from 'spectron'
import { STATE } from '@giterm/git'

const REPO_STATUS = '[data-testid="StatusBar_Status"]'
const BRANCH_STATUS = '[data-testid="StatusBar_Branch"]'
const SHOW_REMOTE_SELECTOR = '[data-testid="StatusBar_ShowRemote"]'

const COMMITS_OUTER = '[data-testid="Commits"]'
const COMMIT_ROW = `[data-testid="commit"]`
const COMMIT_ROW_BY_SHA = (sha: string) =>
  `[data-testid="commit"][data-sha="${sha}"]`
const COMMIT_REF = (localName: string) => `[data-testid="ref-${localName}"]`
const LOCAL_BRANCH_ICON = `[data-testid="localBranch"]`
const TRACKED_BRANCH_ICON = `[data-testid="remoteInSync"]`
const REMOTE_BRANCH_ICON = `[data-testid="remoteBranch"]`
const REMOTE_AHEAD_ICON = `[data-testid="remoteAhead"]`
const REMOTE_BEHIND_ICON = `[data-testid="remoteBehind"]`
const TAG_ICON = `[data-testid="tag"]`

interface RemoteBranchInfo {
  hasRemote: true
  ahead: number
  behind: number
}

interface RefBranch {
  type: 'branch'
  name: string
  remote?: RemoteBranchInfo
}

interface RefTag {
  type: 'tag'
  name: string
}

interface RefRemoteBranch {
  type: 'remote-branch'
  name: string
}

type Ref = RefBranch | RefTag | RefRemoteBranch

export class GuiValidator {
  private wd: SpectronClient

  constructor(wd: SpectronClient) {
    this.wd = wd
  }

  private exists = async (
    selector: string,
    within: WebdriverIO.Element | SpectronClient = this.wd,
  ) => {
    const el = await within.$(selector)
    await el.waitForExist()

    return el
  }

  private checkRemoteBranchInfo = async (
    branchElement: WebdriverIO.Element,
    remote?: RemoteBranchInfo,
  ) => {
    if (remote && remote.hasRemote) {
      if (remote.ahead > 0 || remote.behind > 0) {
        if (remote.ahead > 0) {
          const el = await this.exists(REMOTE_AHEAD_ICON, branchElement)
          const parent = await el.parentElement()
          this.wd.waitUntilTextExists(parent.selector, '' + remote.ahead)
        }
        if (remote.behind > 0) {
          const el = await this.exists(REMOTE_BEHIND_ICON, branchElement)
          const parent = await el.parentElement()
          this.wd.waitUntilTextExists(parent.selector, '' + remote.behind)
        }
      } else {
        await this.exists(TRACKED_BRANCH_ICON, branchElement)
      }
    }
  }

  loaded = async () => {
    await this.wd.waitUntilTextExists(SHOW_REMOTE_SELECTOR, 'Show Remote')
  }

  status = async (status: string) => {
    await this.wd.waitUntilTextExists(REPO_STATUS, status)
  }

  currentBranch = async (branchName: string, remote?: RemoteBranchInfo) => {
    const branchStatus = await this.exists(BRANCH_STATUS)

    await this.wd.waitUntilTextExists(branchStatus.selector, branchName)

    await this.checkRemoteBranchInfo(branchStatus, remote)
  }

  commits = async (count: number) => {
    const commits = await this.wd.$$(COMMIT_ROW)
    expect(commits.length).toBe(count)
  }

  commit = async (index: number, commitMessage: string, refs?: Ref[]) => {
    const commits = await this.wd.$$(COMMIT_ROW)

    const commit = commits[index]
    expect(!!commit).toBe(true)

    await this.wd.waitUntilTextExists(commit.selector, commitMessage)
    if (refs && refs.length > 0) {
      for (const ref of refs) {
        const refElement = await this.exists(COMMIT_REF(ref.name), commit)

        if (ref.type === 'branch') {
          await this.exists(LOCAL_BRANCH_ICON, refElement)

          await this.checkRemoteBranchInfo(refElement, ref.remote)

          continue
        }
        if (ref.type === 'remote-branch') {
          await this.exists(REMOTE_BRANCH_ICON, refElement)

          continue
        }
        if (ref.type === 'tag') {
          await this.exists(TAG_ICON, refElement)

          continue
        }

        throw `Unknown ref type: ${(ref as any).type}`
      }
    }
  }
}
