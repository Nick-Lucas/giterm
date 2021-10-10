import os from 'os'
import fs from 'fs'
import path from 'path'
import child_process from 'child_process'
import { Git } from './Git'
import { STATE } from './constants'
import { Commit, DiffResult, DiffFile, StatusFile } from './types'

const tmp = os.tmpdir()

const getSpawn =
  (cwd: string) =>
  async (
    args: string[],
    { errorOnNonZeroExit = true } = {},
  ): Promise<string> => {
    const buffers: Buffer[] = []
    const child = child_process.spawn('git', args, { cwd })

    return new Promise((resolve, reject) => {
      child.stdout.on('data', (data) => {
        buffers.push(data)
      })

      child.stderr.on('data', (data) => {
        buffers.push(data)
      })

      child.on('close', (code) => {
        if (code != 0 && errorOnNonZeroExit) {
          const text = String(Buffer.concat(buffers))
          console.error(text)
          reject(text)
        } else {
          resolve(String(Buffer.concat(buffers)))
        }
      })
    })
  }

describe('Git', () => {
  let dir = ''
  let spawn = getSpawn(dir)

  async function waitToFixGitTime() {
    await new Promise((r) => setTimeout(r, 500))
  }

  function writeFile(name: string, text: string) {
    const filePath = path.join(dir, name)
    fs.writeFileSync(filePath, text, { encoding: 'utf8' })
  }

  function renameFile(name: string, newName: string) {
    fs.renameSync(path.join(dir, name), path.join(dir, newName))
  }

  function rmFile(name: string) {
    const filePath = path.join(dir, name)
    if (!fs.existsSync(filePath)) {
      throw `'${name}' does not exist in dir ${dir}`
    }

    fs.unlinkSync(filePath)
  }

  async function commit(text: string) {
    await spawn(['add', '--all'])
    await spawn([`commit`, `-m`, text])
    const sha = await spawn([`rev-parse`, `HEAD`])

    return sha.trim()
  }

  async function createRemote() {
    const remoteDir = fs.mkdtempSync(path.join(tmp, 'giterm-git-remote-'))
    const remoteFile = 'remote.git'

    const remoteSpawn = getSpawn(remoteDir)
    await remoteSpawn(['init', '--bare', remoteFile])

    return path.join(remoteDir, remoteFile)
  }

  beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(tmp, 'giterm-git-'))
    spawn = getSpawn(dir)
  })

  describe('getStateText', () => {
    it('has no repo', async () => {
      const git = new Git(dir)
      const result = await git.getStateText()
      expect(result).toBe(STATE.NO_REPO)
    })

    it('is ok', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      const result = await git.getStateText()
      expect(result).toBe(STATE.OK)
    })

    it('is rebasing', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      // We create a rebase conflict between two branches
      await spawn(['checkout', '-b', 'branch-a'])
      writeFile('f1.txt', 'abc')
      await commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      writeFile('f1.txt', 'cba')
      await commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      writeFile('f1.txt', 'abccba')
      await commit('Third Commit')
      await spawn(['rebase', 'branch-b'], { errorOnNonZeroExit: false })

      const result = await git.getStateText()
      expect(result).toBe(STATE.REBASING)
    })

    it('is merging', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      // We create a merge conflict between two branches
      await spawn(['checkout', '-b', 'branch-a'])
      writeFile('f1.txt', 'abc')
      await commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      writeFile('f1.txt', 'cba')
      await commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      writeFile('f1.txt', 'abccba')
      await commit('Third Commit')
      await spawn(['merge', 'branch-b'], { errorOnNonZeroExit: false })

      const result = await git.getStateText()
      expect(result).toBe(STATE.MERGING)
    })

    it('is cherry-picking', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      // We create a merge conflict between two branches
      await spawn(['checkout', '-b', 'branch-a'])
      writeFile('f1.txt', 'abc')
      await commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      writeFile('f1.txt', 'cba')
      await commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      writeFile('f1.txt', 'abccba')
      await commit('Third Commit')
      await spawn(['cherry-pick', 'branch-b'], { errorOnNonZeroExit: false })

      const result = await git.getStateText()
      expect(result).toBe(STATE.CHERRY_PICKING)
    })

    it.todo('is applying mailbox')
    it.todo('is reverting')
    it.todo('is bisecting')
  })

  describe('getHeadSHA', () => {
    it('works for no repo', async () => {
      const git = new Git(dir)
      const sha = await git.getHeadSHA()
      expect(sha).toBe('')
    })

    it('returns sha on branch', async () => {
      await spawn(['init'])
      writeFile('f1.txt', 'abc')
      const commitSha = await commit('Initial commit')

      const git = new Git(dir)
      const sha = await git.getHeadSHA()
      expect(sha).toHaveLength(40)
      expect(sha).toBe(commitSha)
    })

    it('returns sha when detached', async () => {
      await spawn(['init'])
      writeFile('f1.txt', 'abc')
      await commit('Initial commit')
      writeFile('f1.txt', 'abcd')
      const commitSha = await commit('Second commit')
      await spawn(['checkout', commitSha])

      const git = new Git(dir)
      const sha = await git.getHeadSHA()
      expect(sha).toHaveLength(40)
      expect(sha).toBe(commitSha)
    })
  })

  describe('getStatus', () => {
    it('works for no repo', async () => {
      const git = new Git(dir)

      const status = await git.getStatus()
      expect(status).toEqual<StatusFile[]>([])
    })

    it.each(['staged', 'unstaged'])('lists %s new file', async (stagedKey) => {
      await spawn(['init'])
      const git = new Git(dir)
      writeFile('f1.txt', 'abcdefg')
      if (stagedKey === 'staged') {
        await spawn(['add', '--all'])
      }

      const status = await git.getStatus()
      expect(status).toEqual<StatusFile[]>([
        {
          path: 'f1.txt',
          oldPath: null,
          staged: stagedKey === 'staged',
          unstaged: stagedKey === 'unstaged',
          isNew: true,
          isDeleted: false,
          isModified: false,
          isRename: false,
        },
      ])
    })

    it.each(['staged', 'unstaged'])(
      'lists %s modified file',
      async (stagedKey) => {
        await spawn(['init'])
        const git = new Git(dir)

        writeFile('f1.txt', 'abcdefg')
        await commit('Initial Commit')
        writeFile('f1.txt', 'abcdef')
        if (stagedKey === 'staged') {
          await spawn(['add', '--all'])
        }

        const status = await git.getStatus()

        expect(status).toEqual<StatusFile[]>([
          {
            path: 'f1.txt',
            oldPath: null,
            staged: stagedKey === 'staged',
            unstaged: stagedKey === 'unstaged',
            isNew: false,
            isDeleted: false,
            isModified: true,
            isRename: false,
          },
        ])
      },
    )

    it.each(['staged', 'unstaged'])(
      'lists %s deleted file',
      async (stagedKey) => {
        await spawn(['init'])
        const git = new Git(dir)

        writeFile('f1.txt', 'abcdefg')
        await commit('Initial Commit')
        rmFile('f1.txt')
        if (stagedKey === 'staged') {
          await spawn(['add', '--all'])
        }

        const status = await git.getStatus()

        expect(status).toEqual<StatusFile[]>([
          {
            path: 'f1.txt',
            oldPath: null,
            staged: stagedKey === 'staged',
            unstaged: stagedKey === 'unstaged',
            isNew: false,
            isDeleted: true,
            isModified: false,
            isRename: false,
          },
        ])
      },
    )

    it('lists unstaged renamed file', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      writeFile('f1.txt', 'abcdefg')
      await commit('Initial Commit')
      renameFile('f1.txt', 'f2.txt')

      const status = await git.getStatus()

      expect(status).toEqual<StatusFile[]>([
        {
          path: 'f1.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: false,
          isDeleted: true,
          isModified: false,
          isRename: false,
        },
        {
          path: 'f2.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: true,
          isDeleted: false,
          isModified: false,
          isRename: false,
        },
      ])
    })

    it('lists staged renamed file', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      writeFile('f1.txt', 'abcdefg')
      await commit('Initial Commit')
      renameFile('f1.txt', 'f2.txt')
      await spawn(['add', '--all'])

      const status = await git.getStatus()

      expect(status).toEqual<StatusFile[]>([
        {
          path: 'f2.txt',
          oldPath: 'f1.txt',
          staged: true,
          unstaged: false,
          isNew: false,
          isDeleted: false,
          isModified: false,
          isRename: true,
        },
      ])
    })

    it('lists a combination of unstaged files', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      writeFile('f1.txt', 'abcdefg')
      writeFile('f2.txt', 'abcdefg')
      writeFile('f3.txt', 'abcdefg')
      writeFile('f rename.txt', 'abcdefg')
      await commit('Initial Commit')
      rmFile('f1.txt')
      writeFile('f2.txt', 'abc')
      writeFile('f4.txt', 'jnasd')
      renameFile('f rename.txt', 'f renamed.txt')

      const status = await git.getStatus()

      expect(status).toEqual<StatusFile[]>([
        {
          path: 'f rename.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: false,
          isDeleted: true,
          isModified: false,
          isRename: false,
        },
        {
          path: 'f renamed.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: true,
          isDeleted: false,
          isModified: false,
          isRename: false,
        },
        {
          path: 'f1.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: false,
          isDeleted: true,
          isModified: false,
          isRename: false,
        },
        {
          path: 'f2.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: false,
          isDeleted: false,
          isModified: true,
          isRename: false,
        },
        {
          path: 'f4.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: true,
          isDeleted: false,
          isModified: false,
          isRename: false,
        },
      ])
    })

    it('lists a combination of staged files', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      writeFile('f1.txt', 'abcdefg')
      writeFile('f2.txt', 'abcdefg')
      writeFile('f3.txt', 'abcdefg')
      writeFile('f rename.txt', 'abcdefg')
      await commit('Initial Commit')
      rmFile('f1.txt')
      writeFile('f2.txt', 'abc')
      writeFile('f4.txt', 'jnasd')
      renameFile('f rename.txt', 'f renamed.txt')

      await spawn(['add', '--all'])

      const status = await git.getStatus()

      expect(status).toEqual<StatusFile[]>([
        {
          path: 'f renamed.txt',
          oldPath: 'f rename.txt',
          staged: true,
          unstaged: false,
          isNew: false,
          isDeleted: false,
          isModified: false,
          isRename: true,
        },
        {
          path: 'f1.txt',
          oldPath: null,
          staged: true,
          unstaged: false,
          isNew: false,
          isDeleted: true,
          isModified: false,
          isRename: false,
        },
        {
          path: 'f2.txt',
          oldPath: null,
          staged: true,
          unstaged: false,
          isNew: false,
          isDeleted: false,
          isModified: true,
          isRename: false,
        },
        {
          path: 'f4.txt',
          oldPath: null,
          staged: true,
          unstaged: false,
          isNew: true,
          isDeleted: false,
          isModified: false,
          isRename: false,
        },
      ])
    })
  })

  describe('getAllBranches', () => {
    it('works for no repo', async () => {
      const git = new Git(dir)

      const branches = await git.getAllBranches()
      expect(branches).toEqual([])
    })

    it('lists branches', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      writeFile('f1.txt', 'abc')
      await spawn(['checkout', '-b', 'branch-a'])
      await commit('Initial Commit')
      await spawn(['checkout', '-b', 'branch-b'])

      // Note: git doesn't create an initial branch until the first commit
      // So to avoid global config issues for this test we initialise branch-a as the initial branch name
      const branches = await git.getAllBranches()

      expect(branches).toEqual([
        expect.objectContaining({
          id: 'refs/heads/branch-a',
          isHead: false,
          isRemote: false,
          name: 'branch-a',
          upstream: null,
        }),
        expect.objectContaining({
          id: 'refs/heads/branch-b',
          isHead: true,
          isRemote: false,
          name: 'branch-b',
          upstream: null,
        }),
      ])

      // Check that the deleted variable data meets correct rules
      for (const branch of branches) {
        expect(branch.authorDate).toHaveLength(10)
        expect(branch.date).toHaveLength(10)
        expect(branch.headSHA).toHaveLength(40)
      }
    })

    describe('with remote', () => {
      beforeEach(async () => {
        await spawn(['init'])

        writeFile('f1.txt', 'abc')
        await spawn(['checkout', '-b', 'branch-a'])
        await commit('Initial Commit')
        await spawn(['checkout', '-b', 'branch-b'])

        const remoteUri = await createRemote()
        await spawn(['remote', 'add', 'origin', remoteUri])
        await spawn(['push', '--set-upstream', 'origin', 'branch-b'])
      })

      it('lists branches with upstream', async () => {
        const git = new Git(dir)

        const branches = await git.getAllBranches()

        expect(branches).toEqual([
          expect.objectContaining({
            id: 'refs/heads/branch-a',
            isHead: false,
            isRemote: false,
            name: 'branch-a',
            upstream: null,
          }),
          expect.objectContaining({
            id: 'refs/heads/branch-b',
            isHead: true,
            isRemote: false,
            name: 'branch-b',
            upstream: {
              ahead: 0,
              behind: 0,
              id: 'refs/remotes/origin/branch-b',
              name: 'origin/branch-b',
            },
          }),
          expect.objectContaining({
            id: 'refs/remotes/origin/branch-b',
            isHead: false,
            isRemote: true,
            name: 'origin/branch-b',
            upstream: null,
          }),
        ])

        // Check that the deleted variable data meets correct rules
        for (const branch of branches) {
          expect(branch.authorDate).toHaveLength(10)
          expect(branch.date).toHaveLength(10)
          expect(branch.headSHA).toHaveLength(40)
        }
      })

      it('is behind upstream', async () => {
        const git = new Git(dir)
        await spawn(['branch', '--delete', 'branch-a'])

        writeFile('f2.txt', 'ahead')
        await commit('Pushed Commit')
        await spawn(['push'])
        await spawn(['reset', '--hard', 'HEAD~1'])

        const branches = await git.getAllBranches()

        expect(branches).toEqual([
          expect.objectContaining({
            id: 'refs/heads/branch-b',
            isHead: true,
            isRemote: false,
            name: 'branch-b',
            upstream: {
              ahead: 0,
              behind: 1,
              id: 'refs/remotes/origin/branch-b',
              name: 'origin/branch-b',
            },
          }),
          expect.objectContaining({
            id: 'refs/remotes/origin/branch-b',
            isHead: false,
            isRemote: true,
            name: 'origin/branch-b',
            upstream: null,
          }),
        ])

        // Check that the deleted variable data meets correct rules
        for (const branch of branches) {
          expect(branch.authorDate).toHaveLength(10)
          expect(branch.date).toHaveLength(10)
          expect(branch.headSHA).toHaveLength(40)
        }
      })

      it('is ahead of upstream', async () => {
        const git = new Git(dir)
        await spawn(['branch', '--delete', 'branch-a'])

        writeFile('f2.txt', 'ahead')
        await commit('Unpushed Commit')

        const branches = await git.getAllBranches()

        expect(branches).toEqual([
          expect.objectContaining({
            id: 'refs/heads/branch-b',
            isHead: true,
            isRemote: false,
            name: 'branch-b',
            upstream: {
              ahead: 1,
              behind: 0,
              id: 'refs/remotes/origin/branch-b',
              name: 'origin/branch-b',
            },
          }),
          expect.objectContaining({
            id: 'refs/remotes/origin/branch-b',
            isHead: false,
            isRemote: true,
            name: 'origin/branch-b',
            upstream: null,
          }),
        ])

        // Check that the deleted variable data meets correct rules
        for (const branch of branches) {
          expect(branch.authorDate).toHaveLength(10)
          expect(branch.date).toHaveLength(10)
          expect(branch.headSHA).toHaveLength(40)
        }
      })
    })
  })

  describe('getAllTags', () => {
    it('works for no repo', async () => {
      const git = new Git(dir)

      const tags = await git.getAllTags()
      expect(tags).toEqual([])
    })

    it('shows local tags', async () => {
      await spawn(['init'])
      writeFile('f1.txt', 'abc')
      const sha1 = await commit('First Commit')
      writeFile('f2.txt', 'abc')
      const sha2 = await commit('Second Commit')

      const git = new Git(dir)

      await spawn(['checkout', sha1])
      await spawn(['tag', 'tag1'])
      await spawn(['checkout', sha2])
      await spawn(['tag', 'tag2'])

      const tags = await git.getAllTags()
      expect(tags).toEqual([
        expect.objectContaining({
          headSHA: sha1,
          id: 'refs/tags/tag1',
          name: 'tag1',
        }),
        expect.objectContaining({
          headSHA: sha2,
          id: 'refs/tags/tag2',
          name: 'tag2',
        }),
      ])

      // Check that the deleted variable data meets correct rules
      for (const tag of tags) {
        expect(tag.authorDate).toHaveLength(10)
        expect(tag.date).toHaveLength(10)
      }
    })

    describe('with remote', () => {
      let sha1: string, sha2: string
      const branchName = 'main'

      beforeEach(async () => {
        await spawn(['init'])
        await spawn(['checkout', '-b', branchName])

        writeFile('f1.txt', 'abc')
        sha1 = await commit('First Commit')
        writeFile('f2.txt', 'abc')
        sha2 = await commit('Second Commit')

        const remoteUri = await createRemote()
        await spawn(['remote', 'add', 'origin', remoteUri])
        await spawn(['push', '--set-upstream', 'origin', branchName])

        await spawn(['checkout', sha1])
        await spawn(['tag', 'tag1'])
        await spawn(['checkout', branchName])
        await spawn(['tag', 'tag2'])
        await spawn(['push', '--tags'])
      })

      it('only local tags are listed', async () => {
        // Remove tag1 locally
        await spawn(['tag', '-d', 'tag1'])

        const git = new Git(dir)

        const tags = await git.getAllTags()
        expect(tags).toEqual([
          expect.objectContaining({
            headSHA: sha2,
            id: 'refs/tags/tag2',
            name: 'tag2',
          }),
        ])

        // Check that the deleted variable data meets correct rules
        for (const tag of tags) {
          expect(tag.authorDate).toHaveLength(10)
          expect(tag.date).toHaveLength(10)
        }
      })
    })
  })

  describe('getAllRemotes', () => {
    it('has no repo', async () => {
      const git = new Git(dir)

      const remotes = await git.getAllRemotes()
      expect(remotes).toEqual([])
    })

    it('has no remotes', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      const remotes = await git.getAllRemotes()
      expect(remotes).toEqual([])
    })

    it('has one remote', async () => {
      await spawn(['init'])
      const remoteUri = await createRemote()
      await spawn(['remote', 'add', 'origin', remoteUri])
      const git = new Git(dir)

      const remotes = await git.getAllRemotes()
      expect(remotes).toEqual([{ name: 'origin' }])
    })

    it('has many remotes', async () => {
      await spawn(['init'])
      const remoteUri = await createRemote()
      await spawn(['remote', 'add', 'origin', remoteUri])
      const remoteUri2 = await createRemote()
      await spawn(['remote', 'add', 'my-fork', remoteUri2])
      const git = new Git(dir)

      const remotes = await git.getAllRemotes()
      expect(remotes).toEqual(
        expect.arrayContaining([{ name: 'origin' }, { name: 'my-fork' }]),
      )
    })
  })

  describe('loadAllCommits', () => {
    const commitMatcher = (commit: Partial<Commit>) =>
      expect.objectContaining({
        sha: expect.stringMatching(/.{40}/),
        sha7: expect.stringMatching(/.{7}/),
        ...commit,
      } as Partial<Commit>)

    it('has no repo', async () => {
      const git = new Git(dir)

      const commits = await git.loadAllCommits()
      expect(commits).toEqual([[], ''])
    })

    it('has one local commit', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      writeFile('a.txt', 'abcd')
      await commit('Commit 1')

      const commits = await git.loadAllCommits()
      expect(commits).toEqual([
        [
          commitMatcher({
            message: 'Commit 1',
            isHead: true,
          }),
        ],
        expect.stringMatching(/.+/),
      ])
    })

    it('has a merge commit', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      writeFile('a.txt', 'abcd')
      const shaCommit1 = await commit('Commit 1')
      await spawn(['checkout', '-b', 'branch-a'])
      await spawn(['checkout', '-b', 'branch-b'])

      await waitToFixGitTime()
      writeFile('b.txt', 'abcd')
      const shaBranchCommit = await commit('Branch Commit')

      await waitToFixGitTime()
      await spawn(['checkout', 'branch-a'])
      writeFile('a.txt', 'abcdefg')
      const shaCommit2 = await commit('Commit 2')

      await waitToFixGitTime()
      await spawn(['merge', '--no-ff', 'branch-b'])
      const shaMerge = (await spawn([`rev-parse`, `HEAD`])).trim()

      const commits = await git.loadAllCommits()
      expect(commits).toEqual([
        [
          commitMatcher({
            message: `Merge branch 'branch-b' into branch-a`,
            isHead: true,
            sha: shaMerge,
            parents: [shaCommit2, shaBranchCommit],
          }),
          commitMatcher({
            message: 'Commit 2',
            isHead: false,
            sha: shaCommit2,
            parents: [shaCommit1],
          }),
          commitMatcher({
            message: 'Branch Commit',
            isHead: false,
            sha: shaBranchCommit,
            parents: [shaCommit1],
          }),
          commitMatcher({
            message: 'Commit 1',
            isHead: false,
            sha: shaCommit1,
            parents: [],
          }),
        ],
        expect.stringMatching(/.+/),
      ])
    })

    it("git is commited to so fast that commit times can't be sorted with --date-order child-parent rules", async () => {
      await spawn(['init'])
      const git = new Git(dir)

      writeFile('a.txt', 'abcd')
      const shaCommit1 = await commit('Commit 1')
      await spawn(['checkout', '-b', 'branch-a'])
      await spawn(['checkout', '-b', 'branch-b'])

      writeFile('b.txt', 'abcd')
      const shaBranchCommit = await commit('Branch Commit')

      await spawn(['checkout', 'branch-a'])
      writeFile('a.txt', 'abcdefg')
      const shaCommit2 = await commit('Commit 2')

      await spawn(['merge', '--no-ff', 'branch-b'])
      const shaMerge = (await spawn([`rev-parse`, `HEAD`])).trim()

      const commits = await git.loadAllCommits()
      expect(commits).toEqual([
        [
          commitMatcher({
            message: `Merge branch 'branch-b' into branch-a`,
            isHead: true,
            sha: shaMerge,
            parents: [shaCommit2, shaBranchCommit],
          }),
          commitMatcher({
            message: 'Commit 2',
            isHead: false,
            sha: shaCommit2,
            parents: [shaCommit1],
          }),
          commitMatcher({
            message: 'Branch Commit',
            isHead: false,
            sha: shaBranchCommit,
            parents: [shaCommit1],
          }),
          commitMatcher({
            message: 'Commit 1',
            isHead: false,
            sha: shaCommit1,
            parents: [],
          }),
        ],
        expect.stringMatching(/.+/),
      ])
    })
  })

  describe('getDiffFromShas', () => {
    async function getBaseCommit(): Promise<string> {
      await spawn(['init'])
      writeFile('onlyfile', 'abc')
      return await commit('Base Commit')
    }

    describe.each([
      ['one commit', false],
      ['two commits', true],
    ])('fetching diff for %s', (caseName: string, useOldSha: boolean) => {
      it('added file', async () => {
        const baseSha = await getBaseCommit()
        const git = new Git(dir)

        writeFile('a.txt', 'line 1\nline 2')
        const sha = await commit('Commit 1')

        const diff = (await git.getDiffFromShas(
          sha,
          useOldSha ? baseSha : null,
        ))!

        expect(diff).toEqual<DiffResult>({
          stats: {
            deletions: 0,
            filesChanged: 1,
            insertions: 2,
          },
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: null,
              newName: 'a.txt',
              addedLines: 2,
              deletedLines: 0,
              isNew: true,
              isRename: false,
              isDeleted: false,
              isModified: false,
            }),
          ],
        })
      })

      it('renamed file', async () => {
        await getBaseCommit()
        const git = new Git(dir)

        writeFile('a.txt', 'line 1\nline 2')
        const baseSha = await commit('Commit 1')
        renameFile('a.txt', 'b.txt')
        const sha = await commit('Commit 2')

        const diff = (await git.getDiffFromShas(
          sha,
          useOldSha ? baseSha : null,
        ))!

        expect(diff).toEqual<DiffResult>({
          stats: {
            deletions: 0,
            filesChanged: 1,
            insertions: 0,
          },
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: 'a.txt',
              newName: 'b.txt',
              addedLines: 0,
              isNew: false,
              isRename: true,
              isModified: true,
              isDeleted: false,
            }),
          ],
        })
      })

      it('modified file', async () => {
        await getBaseCommit()
        const git = new Git(dir)

        writeFile('a.txt', 'line 1\nline 3')
        const baseSha = await commit('Commit 1')
        writeFile('a.txt', 'line 1\nline 2')
        const sha = await commit('Commit 2')

        const diff = (await git.getDiffFromShas(
          sha,
          useOldSha ? baseSha : null,
        ))!

        expect(diff).toEqual<DiffResult>({
          stats: {
            deletions: 1,
            filesChanged: 1,
            insertions: 1,
          },
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: 'a.txt',
              newName: 'a.txt',
              addedLines: 1,
              deletedLines: 1,
              isNew: false,
              isRename: false,
              isModified: true,
              isDeleted: false,
            }),
          ],
        })
      })

      it('deleted file', async () => {
        await getBaseCommit()
        const git = new Git(dir)

        writeFile('a.txt', 'line 1\nline 2')
        const baseSha = await commit('Commit 1')
        rmFile('a.txt')
        const sha = await commit('Commit 2')

        const diff = (await git.getDiffFromShas(
          sha,
          useOldSha ? baseSha : null,
        ))!

        expect(diff).toEqual<DiffResult>({
          stats: {
            deletions: 2,
            filesChanged: 1,
            insertions: 0,
          },
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: 'a.txt',
              newName: null,
              addedLines: 0,
              deletedLines: 2,
              isNew: false,
              isRename: false,
              isModified: false,
              isDeleted: true,
            }),
          ],
        })
      })
    })
  })

  describe('getDiffFromIndex', () => {
    async function getBaseCommit(): Promise<string> {
      await spawn(['init'])
      writeFile('a.txt', 'line 1\nline 2')
      return await commit('Base Commit')
    }

    it.each<('staged' | 'unstaged')[]>([['staged'], ['unstaged']])(
      'added file (%s)',
      async (setup: 'staged' | 'unstaged') => {
        await getBaseCommit()
        const git = new Git(dir)

        writeFile('b.txt', 'line 1\nline 2')
        await spawn(['add', '--all'])
        if (setup === 'staged') {
          await spawn(['add', '--all'])
        }

        const diff = (await git.getDiffFromIndex())!

        expect(diff).toEqual<DiffResult>({
          stats: {
            deletions: 0,
            filesChanged: 1,
            insertions: 2,
          },
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: null,
              newName: 'b.txt',
              addedLines: 2,
              deletedLines: 0,
              isNew: true,
              isRename: false,
              isDeleted: false,
              isModified: false,
            }),
          ],
        })
      },
    )

    it.each<('staged' | 'unstaged')[]>([['staged'], ['unstaged']])(
      'modified file (%s)',
      async (setup: 'staged' | 'unstaged') => {
        await getBaseCommit()
        const git = new Git(dir)

        writeFile('a.txt', 'line 1\nline 3')
        await commit('Commit 1')
        writeFile('a.txt', 'line 1\nline 2')
        if (setup === 'staged') {
          await spawn(['add', '--all'])
        }

        const diff = (await git.getDiffFromIndex())!

        expect(diff).toEqual<DiffResult>({
          stats: {
            deletions: 1,
            filesChanged: 1,
            insertions: 1,
          },
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: 'a.txt',
              newName: 'a.txt',
              addedLines: 1,
              deletedLines: 1,
              isNew: false,
              isRename: false,
              isModified: true,
              isDeleted: false,
            }),
          ],
        })
      },
    )

    it.each<('staged' | 'unstaged')[]>([['staged'], ['unstaged']])(
      'deleted file (%s)',
      async (setup: 'staged' | 'unstaged') => {
        await getBaseCommit()
        const git = new Git(dir)

        rmFile('a.txt')
        if (setup === 'staged') {
          await spawn(['add', '--all'])
        }

        const diff = (await git.getDiffFromIndex())!

        expect(diff).toEqual<DiffResult>({
          stats: {
            deletions: 2,
            filesChanged: 1,
            insertions: 0,
          },
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: 'a.txt',
              newName: null,
              addedLines: 0,
              deletedLines: 2,
              isNew: false,
              isRename: false,
              isModified: false,
              isDeleted: true,
            }),
          ],
        })
      },
    )

    it('renamed file (unstaged)', async () => {
      await getBaseCommit()
      const git = new Git(dir)

      renameFile('a.txt', 'b.txt')

      const diff = (await git.getDiffFromIndex())!

      expect(diff).toEqual<DiffResult>({
        stats: {
          deletions: 2,
          filesChanged: 2,
          insertions: 2,
        },
        files: [
          expect.objectContaining<Partial<DiffFile>>({
            oldName: 'a.txt',
            newName: null,
            addedLines: 0,
            deletedLines: 2,
            isNew: false,
            isRename: false,
            isModified: false,
            isDeleted: true,
          }),
          expect.objectContaining<Partial<DiffFile>>({
            oldName: null,
            newName: 'b.txt',
            addedLines: 2,
            deletedLines: 0,
            isNew: true,
            isRename: false,
            isModified: false,
            isDeleted: false,
          }),
        ],
      })
    })

    it('renamed and modified file (unstaged)', async () => {
      await getBaseCommit()
      const git = new Git(dir)

      renameFile('a.txt', 'b.txt')
      writeFile('b.txt', 'line 1\nline 3')

      const diff = (await git.getDiffFromIndex())!

      expect(diff).toEqual<DiffResult>({
        stats: {
          deletions: 2,
          filesChanged: 2,
          insertions: 2,
        },
        files: [
          expect.objectContaining<Partial<DiffFile>>({
            oldName: 'a.txt',
            newName: null,
            addedLines: 0,
            deletedLines: 2,
            isNew: false,
            isRename: false,
            isModified: false,
            isDeleted: true,
          }),
          expect.objectContaining<Partial<DiffFile>>({
            oldName: null,
            newName: 'b.txt',
            addedLines: 2,
            deletedLines: 0,
            isNew: true,
            isRename: false,
            isModified: false,
            isDeleted: false,
          }),
        ],
      })
    })

    it('renamed file (staged)', async () => {
      await getBaseCommit()
      const git = new Git(dir)

      renameFile('a.txt', 'b.txt')
      await spawn(['add', '--all'])

      const diff = (await git.getDiffFromIndex())!

      expect(diff).toEqual<DiffResult>({
        stats: {
          deletions: 0,
          filesChanged: 1,
          insertions: 0,
        },
        files: [
          expect.objectContaining<Partial<DiffFile>>({
            oldName: 'a.txt',
            newName: 'b.txt',
            addedLines: 0,
            deletedLines: 0,
            isNew: false,
            isRename: true,
            isModified: true,
            isDeleted: false,
          }),
        ],
      })
    })

    it('renamed and modified file (staged)', async () => {
      await getBaseCommit()
      const git = new Git(dir)

      renameFile('a.txt', 'b.txt')
      await spawn(['add', '--all'])
      writeFile('b.txt', 'line 1\nline 3')

      const diff = (await git.getDiffFromIndex())!

      expect(diff).toEqual<DiffResult>({
        stats: {
          deletions: 1,
          filesChanged: 1,
          insertions: 1,
        },
        files: [
          expect.objectContaining<Partial<DiffFile>>({
            oldName: 'a.txt',
            newName: 'b.txt',
            addedLines: 1,
            deletedLines: 1,
            isNew: false,
            isRename: true,
            isModified: true,
            isDeleted: false,
          }),
        ],
      })
    })
  })
})
