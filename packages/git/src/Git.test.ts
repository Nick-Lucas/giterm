import { Git } from './Git'
import { STATE } from './constants'
import { DiffResult, DiffFile, StatusFile } from './types'

import { TestGitShim } from './TestGitShim'

describe('Git', () => {
  let shim: TestGitShim
  let dir = ''
  let spawn: ReturnType<TestGitShim['getSpawn']>

  beforeEach(async () => {
    shim = new TestGitShim()
    dir = shim.dir
    spawn = shim.getSpawn(dir)
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
      shim.writeFile('f1.txt', 'abc')
      await shim.commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      shim.writeFile('f1.txt', 'cba')
      await shim.commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      shim.writeFile('f1.txt', 'abccba')
      await shim.commit('Third Commit')
      await spawn(['rebase', 'branch-b'], { errorOnNonZeroExit: false })

      const result = await git.getStateText()
      expect(result).toBe(STATE.REBASING)
    })

    it('is merging', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      // We create a merge conflict between two branches
      await spawn(['checkout', '-b', 'branch-a'])
      shim.writeFile('f1.txt', 'abc')
      await shim.commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      shim.writeFile('f1.txt', 'cba')
      await shim.commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      shim.writeFile('f1.txt', 'abccba')
      await shim.commit('Third Commit')
      await spawn(['merge', 'branch-b'], { errorOnNonZeroExit: false })

      const result = await git.getStateText()
      expect(result).toBe(STATE.MERGING)
    })

    it('is cherry-picking', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      // We create a merge conflict between two branches
      await spawn(['checkout', '-b', 'branch-a'])
      shim.writeFile('f1.txt', 'abc')
      await shim.commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      shim.writeFile('f1.txt', 'cba')
      await shim.commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      shim.writeFile('f1.txt', 'abccba')
      await shim.commit('Third Commit')
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
      shim.writeFile('f1.txt', 'abc')
      const commitSha = await shim.commit('Initial commit')

      const git = new Git(dir)
      const sha = await git.getHeadSHA()
      expect(sha).toHaveLength(40)
      expect(sha).toBe(commitSha)
    })

    it('returns sha when detached', async () => {
      await spawn(['init'])
      shim.writeFile('f1.txt', 'abc')
      await shim.commit('Initial commit')
      shim.writeFile('f1.txt', 'abcd')
      const commitSha = await shim.commit('Second commit')
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
      shim.writeFile('f1.txt', 'abcdefg')
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
          isRenamed: false,
        },
      ])
    })

    it.each(['staged', 'unstaged'])(
      'lists %s modified file',
      async (stagedKey) => {
        await spawn(['init'])
        const git = new Git(dir)

        shim.writeFile('f1.txt', 'abcdefg')
        await shim.commit('Initial Commit')
        shim.writeFile('f1.txt', 'abcdef')
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
            isRenamed: false,
          },
        ])
      },
    )

    it.each(['staged', 'unstaged'])(
      'lists %s deleted file',
      async (stagedKey) => {
        await spawn(['init'])
        const git = new Git(dir)

        shim.writeFile('f1.txt', 'abcdefg')
        await shim.commit('Initial Commit')
        shim.rmFile('f1.txt')
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
            isRenamed: false,
          },
        ])
      },
    )

    it('lists unstaged renamed file', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      shim.writeFile('f1.txt', 'abcdefg')
      await shim.commit('Initial Commit')
      shim.renameFile('f1.txt', 'f2.txt')

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
          isRenamed: false,
        },
        {
          path: 'f2.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: true,
          isDeleted: false,
          isModified: false,
          isRenamed: false,
        },
      ])
    })

    it('lists staged renamed file', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      shim.writeFile('f1.txt', 'abcdefg')
      await shim.commit('Initial Commit')
      shim.renameFile('f1.txt', 'f2.txt')
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
          isRenamed: true,
        },
      ])
    })

    it('lists a combination of unstaged files', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      shim.writeFile('f1.txt', 'abcdefg')
      shim.writeFile('f2.txt', 'abcdefg')
      shim.writeFile('f3.txt', 'abcdefg')
      shim.writeFile('f rename.txt', 'abcdefg')
      await shim.commit('Initial Commit')
      shim.rmFile('f1.txt')
      shim.writeFile('f2.txt', 'abc')
      shim.writeFile('f4.txt', 'jnasd')
      shim.renameFile('f rename.txt', 'f renamed.txt')

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
          isRenamed: false,
        },
        {
          path: 'f renamed.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: true,
          isDeleted: false,
          isModified: false,
          isRenamed: false,
        },
        {
          path: 'f1.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: false,
          isDeleted: true,
          isModified: false,
          isRenamed: false,
        },
        {
          path: 'f2.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: false,
          isDeleted: false,
          isModified: true,
          isRenamed: false,
        },
        {
          path: 'f4.txt',
          oldPath: null,
          staged: false,
          unstaged: true,
          isNew: true,
          isDeleted: false,
          isModified: false,
          isRenamed: false,
        },
      ])
    })

    it('lists a combination of staged files', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      shim.writeFile('f1.txt', 'abcdefg')
      shim.writeFile('f2.txt', 'abcdefg')
      shim.writeFile('f3.txt', 'abcdefg')
      shim.writeFile('f rename.txt', 'abcdefg')
      await shim.commit('Initial Commit')
      shim.rmFile('f1.txt')
      shim.writeFile('f2.txt', 'abc')
      shim.writeFile('f4.txt', 'jnasd')
      shim.renameFile('f rename.txt', 'f renamed.txt')

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
          isRenamed: true,
        },
        {
          path: 'f1.txt',
          oldPath: null,
          staged: true,
          unstaged: false,
          isNew: false,
          isDeleted: true,
          isModified: false,
          isRenamed: false,
        },
        {
          path: 'f2.txt',
          oldPath: null,
          staged: true,
          unstaged: false,
          isNew: false,
          isDeleted: false,
          isModified: true,
          isRenamed: false,
        },
        {
          path: 'f4.txt',
          oldPath: null,
          staged: true,
          unstaged: false,
          isNew: true,
          isDeleted: false,
          isModified: false,
          isRenamed: false,
        },
      ])
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
      const remoteUri = await shim.createRemote()
      await spawn(['remote', 'add', 'origin', remoteUri])
      const git = new Git(dir)

      const remotes = await git.getAllRemotes()
      expect(remotes).toEqual([{ name: 'origin' }])
    })

    it('has many remotes', async () => {
      await spawn(['init'])
      const remoteUri = await shim.createRemote()
      await spawn(['remote', 'add', 'origin', remoteUri])
      const remoteUri2 = await shim.createRemote()
      await spawn(['remote', 'add', 'my-fork', remoteUri2])
      const git = new Git(dir)

      const remotes = await git.getAllRemotes()
      expect(remotes).toEqual(
        expect.arrayContaining([{ name: 'origin' }, { name: 'my-fork' }]),
      )
    })
  })

  describe('getDiffFromShas', () => {
    async function getBaseCommit(): Promise<string> {
      await spawn(['init'])
      shim.writeFile('onlyfile', 'abc')
      return await shim.commit('Base Commit')
    }

    describe.each([
      ['one commit', false],
      ['two commits', true],
    ])('fetching diff for %s', (caseName: string, useOldSha: boolean) => {
      it('added file', async () => {
        const baseSha = await getBaseCommit()
        const git = new Git(dir)

        shim.writeFile('a.txt', 'line 1\nline 2')
        const sha = await shim.commit('Commit 1')

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

        shim.writeFile('a.txt', 'line 1\nline 2')
        const baseSha = await shim.commit('Commit 1')
        shim.renameFile('a.txt', 'b.txt')
        const sha = await shim.commit('Commit 2')

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

        shim.writeFile('a.txt', 'line 1\nline 3')
        const baseSha = await shim.commit('Commit 1')
        shim.writeFile('a.txt', 'line 1\nline 2')
        const sha = await shim.commit('Commit 2')

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

        shim.writeFile('a.txt', 'line 1\nline 2')
        const baseSha = await shim.commit('Commit 1')
        shim.rmFile('a.txt')
        const sha = await shim.commit('Commit 2')

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
      shim.writeFile('a.txt', 'line 1\nline 2')
      return await shim.commit('Base Commit')
    }

    it.each<('staged' | 'unstaged')[]>([['staged'], ['unstaged']])(
      'added file (%s)',
      async (setup: 'staged' | 'unstaged') => {
        await getBaseCommit()
        const git = new Git(dir)

        shim.writeFile('b.txt', 'line 1\nline 2')
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

        shim.writeFile('a.txt', 'line 1\nline 3')
        await shim.commit('Commit 1')
        shim.writeFile('a.txt', 'line 1\nline 2')
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

        shim.rmFile('a.txt')
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

      shim.renameFile('a.txt', 'b.txt')

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

      shim.renameFile('a.txt', 'b.txt')
      shim.writeFile('b.txt', 'line 1\nline 3')

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

      shim.renameFile('a.txt', 'b.txt')
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

      shim.renameFile('a.txt', 'b.txt')
      shim.writeFile('b.txt', 'line 1\nline 3')
      await spawn(['add', '--all'])

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
