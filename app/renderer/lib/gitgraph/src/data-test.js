import { TestGitBuilder } from './GitGraphRenderLib/TestGitBuilder'

const git = new TestGitBuilder()

git.addCommit({ id: 'a1', parentId: 'root' })
git.addCommit({ id: 'b1', parentId: 'root' })
git.addMerge({ id: 'm1', parentId1: 'root', parentId2: 'b1' })
git.addCommit({ id: 'a2', parentId: 'a1' })
git.addCommit({ id: 'c1', parentId: 'm1' })
git.addMerge({ id: 'm2', parentId1: 'm1', parentId2: 'a2' })
git.addMerge({ id: 'm3', parentId1: 'm2', parentId2: 'c1' })

export const data = {
  // commits: git.getCommits(),

  // TODO: fix bug
  commits: [
    {
      sha: 'root2',
      parents: ['root1'],
      isHead: false,
    },
    {
      sha: 'a2',
      parents: ['root', 'a1_root'],
      isHead: false,
    },
    {
      sha: 'root1',
      parents: ['root'],
      isHead: false,
    },
    {
      // TODO: this is what's messing it up now, because it gets marked as an
      //         orphan and removed, causing A2 to be tracked as column:0
      sha: 'root',
      parents: [],
      isHead: false,
    },
    {
      sha: 'a1_root',
      parents: [],
      isHead: false,
    },
  ],

  // TODO: check that this also behaves once fixed
  // commits: [
  //   {
  //     sha: 'root2',
  //     parents: ['root1'],
  //     isHead: false,
  //   },
  //   {
  //     sha: 'a3',
  //     parents: ['root', 'a2'],
  //     isHead: false,
  //   },
  //   {
  //     sha: 'a2',
  //     parents: ['a1_root'],
  //     isHead: false,
  //   },
  //   {
  //     sha: 'root1',
  //     parents: ['root'],
  //     isHead: false,
  //   },
  //   {
  //     sha: 'root',
  //     parents: [],
  //     isHead: false,
  //   },
  //   {
  //     sha: 'a1_root',
  //     parents: [],
  //     isHead: false,
  //   },
  // ],
}
