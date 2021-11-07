import { SpectronClient } from 'spectron'
import { STATE } from '@giterm/git'

const CHEVRON_CLOSE = '[data-testid="chevron-close"]'
const CHEVRON_OPEN = '[data-testid="chevron-open"]'

const REPO_STATUS = '[data-testid="StatusBar_Status"]'
const BRANCH_STATUS = '[data-testid="StatusBar_Branch"]'
const SHOW_REMOTE_SELECTOR = '[data-testid="StatusBar_ShowRemote"]'

const REMOTES_OUTER = '[data-testid="remotes"]'
const REMOTE_ROW = `[data-testid="remote"]`
const REMOTE_ROW_BY_NAME = (name: string) => `[data-remoteid="${name}"]`
const TAGS_OUTER = '[data-testid="tags"]'
const TAG_ROW = `[data-testid="tag"]`
const TAG_ROW_BY_NAME = (name: string) => `[data-tagid="${name}"]`
const BRANCHES_OUTER = '[data-testid="branches"]'
const BRANCH_ROW = `[data-testid="branch"]`
const BRANCH_ROW_BY_NAME = (name: string) => `[data-branchid="${name}"]`
const COMMITS_OUTER = '[data-testid="Commits"]'
const COMMIT_ROW = `[data-testid="commit"]`
const COMMIT_ROW_BY_SHA = (sha: string) =>
  `[data-testid="commit"][data-sha="${sha}"]`
const COMMIT_REF = `[data-testid="ref"]`
const COMMIT_REF_BY_TEXT = (text: string) => `[data-refid="ref-${text}"]`
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

interface CheckScreen {
  status: string
  currentBranch: {
    name: string
    remote?: RemoteBranchInfo
  }
  remotes: string[]
  branches: Omit<RefBranch, 'type'>[]
  tags: Omit<RefTag, 'type'>[]
  commits: number
  commitChecks: {
    index: number
    message: string
    refs?: Ref[]
  }[]
}

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

  screen = async (expected: CheckScreen) => {
    await this.status(expected.status)
    await this.currentBranch(expected.currentBranch.name)
    await this.branches(expected.branches)
    await this.tags(expected.tags)
    await this.remotes(expected.remotes)

    await this.commits(expected.commits)
    for (const commit of expected.commitChecks) {
      await this.commit(commit.index, commit.message, commit.refs)
    }
  }

  status = async (status: string) => {
    await this.wd.waitUntilTextExists(REPO_STATUS, status)
  }

  remotes = async (remoteNames: string[]) => {
    const remotesSection = await this.exists(REMOTES_OUTER)
    const chevronOpen = await remotesSection.$(CHEVRON_OPEN)
    if (await chevronOpen.isExisting()) {
      await chevronOpen.click()
      await this.exists(CHEVRON_CLOSE)
    }

    const remoteRows = await remotesSection.$$(REMOTE_ROW)
    expect(remoteRows.length).toBe(remoteNames.length)

    for (const remoteName of remoteNames) {
      await this.exists(REMOTE_ROW_BY_NAME(remoteName), remotesSection)
    }
  }

  currentBranch = async (branchName: string, remote?: RemoteBranchInfo) => {
    const branchStatus = await this.exists(BRANCH_STATUS)

    await this.wd.waitUntilTextExists(branchStatus.selector, branchName)

    await this.checkRemoteBranchInfo(branchStatus, remote)
  }

  branches = async (branches: Omit<RefBranch, 'type'>[]) => {
    const branchesSection = await this.exists(BRANCHES_OUTER)
    const chevronOpen = await branchesSection.$(CHEVRON_OPEN)
    if (await chevronOpen.isExisting()) {
      await chevronOpen.click()
      await this.exists(CHEVRON_CLOSE)
    }

    const branchRows = await branchesSection.$$(BRANCH_ROW)
    expect(branchRows.length).toBe(branches.length)

    for (const branch of branches) {
      const branchRow = await this.exists(
        BRANCH_ROW_BY_NAME(branch.name),
        branchesSection,
      )

      await this.checkRemoteBranchInfo(branchRow, branch.remote)
    }
  }

  tags = async (tags: Omit<RefTag, 'type'>[]) => {
    const tagsSection = await this.exists(TAGS_OUTER)
    const chevronOpen = await tagsSection.$(CHEVRON_OPEN)
    if (await chevronOpen.isExisting()) {
      await chevronOpen.click()
      await this.exists(CHEVRON_CLOSE)
    }

    const tagRows = await tagsSection.$$(TAG_ROW)
    expect(tagRows.length).toBe(tags.length)

    for (const tag of tags) {
      await this.exists(TAG_ROW_BY_NAME(tag.name), tagsSection)
    }
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

    const refElements = await this.wd.$$(COMMIT_REF)

    // Check that we have the same number on both sides, we should always validate every ref on a commit
    const expectedRefsLength = refs?.length ?? 0
    expect(refElements.length).toBe(expectedRefsLength)

    if (refs && refs.length > 0) {
      for (const ref of refs) {
        const refElement = await this.exists(
          COMMIT_REF_BY_TEXT(ref.name),
          commit,
        )

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
