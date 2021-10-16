import { Git } from './Git'
import { TestGitShim } from './TestGitShim'

import { BranchRef, TagRef } from './GitRefs'

describe('Git', () => {
  let shim: TestGitShim
  let dir = ''
  let spawn: ReturnType<TestGitShim['getSpawn']>

  beforeEach(async () => {
    shim = new TestGitShim()
    dir = shim.dir
    spawn = shim.getSpawn(dir)
  })

  describe('getAllBranches', () => {
    it('works for no repo', async () => {
      const git = new Git(dir)

      const branches = await git.refs.getAllBranches({ sort: 'refname' })
      expect(branches.refs).toEqual([])
    })

    it('lists branches', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      shim.writeFile('f1.txt', 'abc')
      await spawn(['checkout', '-b', 'branch-a'])
      const sha = await shim.commit('Initial Commit')
      await spawn(['checkout', '-b', 'branch-b'])

      // Note: git doesn't create an initial branch until the first commit
      // So to avoid global config issues for this test we initialise branch-a as the initial branch name
      const branches = await git.refs.getAllBranches({ sort: 'refname' })

      expect(branches.refs).toEqual([
        expect.objectContaining<Partial<BranchRef>>({
          sha,
          local: {
            id: 'refs/heads/branch-a',
            name: 'branch-a',
          },
          isHead: false,
          upstream: false,
        }),
        expect.objectContaining<Partial<BranchRef>>({
          sha,
          local: {
            id: 'refs/heads/branch-b',
            name: 'branch-b',
          },
          isHead: true,
          upstream: false,
        }),
      ])

      // Check that the deleted variable data meets correct rules
      for (const branch of branches.refs) {
        expect(branch.authorDate).toHaveLength(10)
        expect(branch.commitDate).toHaveLength(10)
      }
    })

    describe('with remote', () => {
      beforeEach(async () => {
        await spawn(['init'])

        shim.writeFile('f1.txt', 'abc')
        await spawn(['checkout', '-b', 'branch-a'])
        await shim.commit('Initial Commit')
        await spawn(['checkout', '-b', 'branch-b'])

        const remoteUri = await shim.createRemote()
        await spawn(['remote', 'add', 'origin', remoteUri])
        await spawn(['push', '--set-upstream', 'origin', 'branch-b'])
      })

      it('lists branches with upstream', async () => {
        const git = new Git(dir)

        const branches = await git.refs.getAllBranches({ sort: 'refname' })

        expect(branches.refs).toEqual([
          expect.objectContaining<Partial<BranchRef>>({
            local: {
              id: 'refs/heads/branch-a',
              name: 'branch-a',
            },
            isHead: false,
            upstream: false,
          }),
          expect.objectContaining<Partial<BranchRef>>({
            local: {
              id: 'refs/heads/branch-b',
              name: 'branch-b',
            },
            isHead: true,
            upstream: {
              ahead: 0,
              behind: 0,
              id: 'refs/remotes/origin/branch-b',
              name: 'origin/branch-b',
            },
          }),
        ])

        // Check that the deleted variable data meets correct rules
        for (const branch of branches.refs) {
          expect(branch.authorDate).toHaveLength(10)
          expect(branch.commitDate).toHaveLength(10)
          expect(branch.sha).toHaveLength(40)
        }
      })

      it('is behind upstream', async () => {
        const git = new Git(dir)
        await spawn(['branch', '--delete', 'branch-a'])

        shim.writeFile('f2.txt', 'ahead')
        await shim.commit('Pushed Commit')
        await spawn(['push'])
        await spawn(['reset', '--hard', 'HEAD~1'])

        const branches = await git.refs.getAllBranches({ sort: 'refname' })

        expect(branches.refs).toEqual([
          expect.objectContaining<Partial<BranchRef>>({
            local: {
              id: 'refs/heads/branch-b',
              name: 'branch-b',
            },
            isHead: true,
            upstream: {
              id: 'refs/remotes/origin/branch-b',
              name: 'origin/branch-b',
              ahead: 0,
              behind: 1,
            },
          }),
        ])

        // Check that the deleted variable data meets correct rules
        for (const branch of branches.refs) {
          expect(branch.authorDate).toHaveLength(10)
          expect(branch.commitDate).toHaveLength(10)
          expect(branch.sha).toHaveLength(40)
        }
      })

      it('is ahead of upstream', async () => {
        const git = new Git(dir)
        await spawn(['branch', '--delete', 'branch-a'])

        shim.writeFile('f2.txt', 'ahead')
        await shim.commit('Unpushed Commit')

        const branches = await git.refs.getAllBranches({ sort: 'refname' })

        expect(branches.refs).toEqual([
          expect.objectContaining<Partial<BranchRef>>({
            local: {
              id: 'refs/heads/branch-b',
              name: 'branch-b',
            },
            isHead: true,
            upstream: {
              id: 'refs/remotes/origin/branch-b',
              name: 'origin/branch-b',
              ahead: 1,
              behind: 0,
            },
          }),
        ])

        // Check that the deleted variable data meets correct rules
        for (const branch of branches.refs) {
          expect(branch.authorDate).toHaveLength(10)
          expect(branch.commitDate).toHaveLength(10)
          expect(branch.sha).toHaveLength(40)
        }
      })
    })
  })

  describe('getAllTags', () => {
    it('works for no repo', async () => {
      const git = new Git(dir)

      const tags = await git.refs.getAllTags()
      expect(tags.refs).toEqual([])
    })

    it('shows local tags', async () => {
      await spawn(['init'])
      shim.writeFile('f1.txt', 'abc')
      const sha1 = await shim.commit('First Commit')
      await shim.waitToFixGitTime(1000)
      shim.writeFile('f2.txt', 'abc')
      const sha2 = await shim.commit('Second Commit')

      const git = new Git(dir)

      await spawn(['checkout', sha1])
      await spawn(['tag', 'tag1'])
      await spawn(['checkout', sha2])
      await spawn(['tag', 'tag2'])

      const tags = await git.refs.getAllTags()
      expect(tags.refs).toEqual([
        expect.objectContaining<Partial<TagRef>>({
          sha: sha1,
          id: 'refs/tags/tag1',
          name: 'tag1',
        }),
        expect.objectContaining<Partial<TagRef>>({
          sha: sha2,
          id: 'refs/tags/tag2',
          name: 'tag2',
        }),
      ])

      // Check that the deleted variable data meets correct rules
      for (const tag of tags.refs) {
        expect(tag.authorDate).toHaveLength(10)
        expect(tag.commitDate).toHaveLength(10)
      }
    })

    describe('with remote', () => {
      let sha1: string, sha2: string
      const branchName = 'main'

      beforeEach(async () => {
        await spawn(['init'])
        await spawn(['checkout', '-b', branchName])

        shim.writeFile('f1.txt', 'abc')
        sha1 = await shim.commit('First Commit')
        shim.writeFile('f2.txt', 'abc')
        sha2 = await shim.commit('Second Commit')

        const remoteUri = await shim.createRemote()
        await spawn(['remote', 'add', 'origin', remoteUri])
        await spawn(['push', '--set-upstream', 'origin', branchName])

        await spawn(['checkout', sha1])
        await spawn(['tag', 'tag1'])
        await shim.waitToFixGitTime()
        await spawn(['checkout', branchName])
        await spawn(['tag', 'tag2'])
        await spawn(['push', '--tags'])
      })

      it('only local tags are listed', async () => {
        // Remove tag1 locally
        await spawn(['tag', '-d', 'tag1'])

        const git = new Git(dir)

        const tags = await git.refs.getAllTags()
        expect(tags.refs).toEqual([
          expect.objectContaining<Partial<TagRef>>({
            sha: sha2,
            id: 'refs/tags/tag2',
            name: 'tag2',
          }),
        ])

        // Check that the deleted variable data meets correct rules
        for (const tag of tags.refs) {
          expect(tag.authorDate).toHaveLength(10)
          expect(tag.commitDate).toHaveLength(10)
        }
      })
    })
  })
})
