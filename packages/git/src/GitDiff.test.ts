import { Git } from './Git'
import { DiffResult, DiffFile } from './types'

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

        const diff = (await git.diff.getByShas(
          sha,
          useOldSha ? baseSha : null,
        ))!

        expect(diff).toEqual<DiffResult>({
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: null,
              newName: 'a.txt',
              isNew: true,
              isRenamed: false,
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

        const diff = (await git.diff.getByShas(
          sha,
          useOldSha ? baseSha : null,
        ))!

        expect(diff).toEqual<DiffResult>({
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: 'a.txt',
              newName: 'b.txt',
              isNew: false,
              isRenamed: true,
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

        const diff = (await git.diff.getByShas(
          sha,
          useOldSha ? baseSha : null,
        ))!

        expect(diff).toEqual<DiffResult>({
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: 'a.txt',
              newName: 'a.txt',
              isNew: false,
              isRenamed: false,
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

        const diff = (await git.diff.getByShas(
          sha,
          useOldSha ? baseSha : null,
        ))!

        expect(diff).toEqual<DiffResult>({
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: 'a.txt',
              newName: null,
              isNew: false,
              isRenamed: false,
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

        const diff = (await git.diff.getIndex())!

        expect(diff).toEqual<DiffResult>({
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: null,
              newName: 'b.txt',
              isNew: true,
              isRenamed: false,
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

        const diff = (await git.diff.getIndex())!

        expect(diff).toEqual<DiffResult>({
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: 'a.txt',
              newName: 'a.txt',
              isNew: false,
              isRenamed: false,
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

        const diff = (await git.diff.getIndex())!

        expect(diff).toEqual<DiffResult>({
          files: [
            expect.objectContaining<Partial<DiffFile>>({
              oldName: 'a.txt',
              newName: null,
              isNew: false,
              isRenamed: false,
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

      const diff = (await git.diff.getIndex())!

      expect(diff).toEqual<DiffResult>({
        files: [
          expect.objectContaining<Partial<DiffFile>>({
            oldName: 'a.txt',
            newName: null,
            isNew: false,
            isRenamed: false,
            isModified: false,
            isDeleted: true,
          }),
          expect.objectContaining<Partial<DiffFile>>({
            oldName: null,
            newName: 'b.txt',
            isNew: true,
            isRenamed: false,
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

      const diff = (await git.diff.getIndex())!

      expect(diff).toEqual<DiffResult>({
        files: [
          expect.objectContaining<Partial<DiffFile>>({
            oldName: 'a.txt',
            newName: null,
            isNew: false,
            isRenamed: false,
            isModified: false,
            isDeleted: true,
          }),
          expect.objectContaining<Partial<DiffFile>>({
            oldName: null,
            newName: 'b.txt',
            isNew: true,
            isRenamed: false,
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

      const diff = (await git.diff.getIndex())!

      expect(diff).toEqual<DiffResult>({
        files: [
          expect.objectContaining<Partial<DiffFile>>({
            oldName: 'a.txt',
            newName: 'b.txt',
            isNew: false,
            isRenamed: true,
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

      const diff = (await git.diff.getIndex())!

      expect(diff).toEqual<DiffResult>({
        files: [
          expect.objectContaining<Partial<DiffFile>>({
            oldName: 'a.txt',
            newName: 'b.txt',
            isNew: false,
            isRenamed: true,
            isModified: true,
            isDeleted: false,
          }),
        ],
      })
    })
  })
})
