import { Git } from './Git'
import { Commit } from './GitCommits.types'

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

  describe('loadAllCommits', () => {
    const commitMatcher = (commit: Partial<Commit>) =>
      expect.objectContaining({
        sha: expect.stringMatching(/.{40}/),
        sha7: expect.stringMatching(/.{7}/),
        ...commit,
      } as Partial<Commit>)

    it('has no repo', async () => {
      const git = new Git(dir)

      const { commits, digest } = await git.commits.load()
      expect(commits).toEqual([])
      expect(digest).toEqual('')
    })

    it('has one local commit', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      shim.writeFile('a.txt', 'abcd')
      await shim.commit('Commit 1')

      const { commits, digest } = await git.commits.load()
      expect(commits).toEqual([
        commitMatcher({
          message: 'Commit 1',
          isHead: true,
        }),
      ])
      expect(digest).toEqual(expect.stringMatching(/.+/))
    })

    it('has a merge commit', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      shim.writeFile('a.txt', 'abcd')
      const shaCommit1 = await shim.commit('Commit 1')
      await spawn(['checkout', '-b', 'branch-a'])
      await spawn(['checkout', '-b', 'branch-b'])

      await shim.waitToFixGitTime()
      shim.writeFile('b.txt', 'abcd')
      const shaBranchCommit = await shim.commit('Branch Commit')

      await shim.waitToFixGitTime()
      await spawn(['checkout', 'branch-a'])
      shim.writeFile('a.txt', 'abcdefg')
      const shaCommit2 = await shim.commit('Commit 2')

      await shim.waitToFixGitTime()
      await spawn(['merge', '--no-ff', 'branch-b'])
      const shaMerge = (await spawn([`rev-parse`, `HEAD`])).trim()

      const { commits } = await git.commits.load()
      expect(commits).toEqual([
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
      ])
    })

    it("git is commited to so fast that commit times can't be sorted with --date-order child-parent rules", async () => {
      await spawn(['init'])
      const git = new Git(dir)

      shim.writeFile('a.txt', 'abcd')
      const shaCommit1 = await shim.commit('Commit 1')
      await spawn(['checkout', '-b', 'branch-a'])
      await spawn(['checkout', '-b', 'branch-b'])

      shim.writeFile('b.txt', 'abcd')
      const shaBranchCommit = await shim.commit('Branch Commit')

      await spawn(['checkout', 'branch-a'])
      shim.writeFile('a.txt', 'abcdefg')
      const shaCommit2 = await shim.commit('Commit 2')

      await spawn(['merge', '--no-ff', 'branch-b'])
      const shaMerge = (await spawn([`rev-parse`, `HEAD`])).trim()

      const { commits } = await git.commits.load()
      expect(commits).toEqual([
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
      ])
    })
  })
})
