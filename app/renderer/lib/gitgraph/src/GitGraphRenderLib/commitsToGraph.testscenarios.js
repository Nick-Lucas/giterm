import { TestGitBuilder } from './TestGitBuilder'

export const scenarios = {
  experiments: function() {
    // const git = new TestGitBuilder()

    // git.addCommit({ id: 'a1', parentId: 'root' })
    // git.addCommit({ id: 'b1', parentId: 'root' })
    // git.addMerge({ id: 'm1', parentId1: 'root', parentId2: 'b1' })
    // git.addCommit({ id: 'a2', parentId: 'a1' })
    // git.addCommit({ id: 'c1', parentId: 'm1' })
    // git.addMerge({ id: 'm2', parentId1: 'm1', parentId2: 'a2' })
    // git.addMerge({ id: 'm3', parentId1: 'm2', parentId2: 'c1' })
    // commits: git.getCommits(),

    // TODO: fix bug
    return [
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
    ]

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
  },

  'standard.a': (function() {
    const git = new TestGitBuilder()
    git.addCommit()
    git.addCommit()
    return git.getCommits()
  })(),
  'standard.b': (function() {
    const git = new TestGitBuilder()
    git.addCommit({ id: 'branch_a', parentId: 'root' })
    git.addCommit({ id: 'branch_b', parentId: 'root' })
    return git.getCommits()
  })(),
  'standard.c': (function() {
    const git = new TestGitBuilder()
    git.addCommit({ id: 'branch_a', parentId: 'root' })
    git.addMerge({ parentId1: 'root', parentId2: 'branch_a' })
    return git.getCommits()
  })(),
  'standard.d': (function() {
    const git = new TestGitBuilder()
    git.addCommit({ id: 'branch_b', orphan: true })
    git.addCommit({ id: 'branch_a', parentId: 'root' })
    return git.getCommits()
  })(),
  'standard.e': (function() {
    const git = new TestGitBuilder()
    git.addMerge({
      id: 'branch_a',
      parentId1: 'root',
      parentId2: 'unseen',
      explicitParent2IsMissing: true,
    })
    return git.getCommits()
  })(),

  'repeated-merging.a': (function() {
    const git = new TestGitBuilder()
    git.addCommit({ id: 'branch_b_1', parentId: 'root' })
    git.addCommit({ id: 'root_2', parentId: 'root' })
    git.addMerge({ parentId1: 'branch_b_1', parentId2: 'root_2' })
    git.addCommit({ id: 'root_3', parentId: 'root_2' })
    return git.getCommits()
  })(),
  'repeated-merging.b': (function() {
    const git = new TestGitBuilder()
    git.addCommit({ id: 'branch_b_1', parentId: 'root' })
    git.addMerge({ id: 'root_2', parentId1: 'root', parentId2: 'branch_b_1' })
    git.addCommit({ id: 'branch_b_2', parentId: 'branch_b_1' })
    git.addMerge({ parentId1: 'root_2', parentId2: 'branch_b_2' })
    return git.getCommits()
  })(),

  'multi-branch.a': (function() {
    const git = new TestGitBuilder()
    git.addCommit({ id: 'a1', parentId: 'root' })
    git.addCommit({ id: 'b1', parentId: 'root' })
    git.addMerge({ id: 'm1', parentId1: 'root', parentId2: 'a1' })
    git.addMerge({ id: 'm2', parentId1: 'm1', parentId2: 'b1' })
    return git.getCommits()
  })(),
  'multi-branch.b': (function() {
    const git = new TestGitBuilder()
    git.addCommit({ id: 'a1', parentId: 'root' })
    git.addCommit({ id: 'b1', parentId: 'root' })
    git.addMerge({ id: 'm1', parentId1: 'root', parentId2: 'b1' })
    git.addCommit({ id: 'a2', parentId: 'a1' })
    git.addCommit({ id: 'c1', parentId: 'm1' })
    git.addMerge({ id: 'm2', parentId1: 'm1', parentId2: 'a2' })
    git.addMerge({ id: 'm3', parentId1: 'm2', parentId2: 'c1' })
    return git.getCommits()
  })(),

  'data-driven.a': [
    {
      sha: 'root2',
      parents: ['root1', 'a2'],
    },
    {
      sha: 'a2',
      parents: ['a1'],
    },
    {
      sha: 'root1',
      parents: ['root', 'a1'],
    },
    {
      sha: 'b1',
      parents: ['root'],
    },
    {
      sha: 'a1',
      parents: ['root'],
    },
    {
      sha: 'root',
      parents: [],
    },
  ],
  'data-driven.b': [
    {
      sha: 'a2',
      sha7: 'a2',
      parents: ['a1', 'root1'],
    },
    {
      sha: 'root1',
      sha7: 'root1',
      parents: ['root'],
    },
    {
      sha: 'a1',
      sha7: 'a1',
      parents: ['root'],
    },
    {
      sha: 'root',
      sha7: 'root',
      parents: [],
    },
  ],
  'data-driven.c': [
    {
      sha: 'root1',
      parents: ['root', 'a2'],
      isHead: false,
    },
    {
      sha: 'a2',
      parents: ['a1', 'root'],
      isHead: false,
    },
    {
      sha: 'a1',
      parents: ['root'],
      isHead: false,
    },
    {
      sha: 'root',
      parents: [],
      isHead: false,
    },
  ],
  'data-driven.d': [
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

  'rehydration.a': (function() {
    const git = new TestGitBuilder()
    git.addCommit({ id: 'a1', parentId: 'root' })
    git.addCommit({ id: 'root2', parentId: 'root' })
    git.addMerge({ parentId1: 'root2', parentId2: 'a1' })
    return git.getCommits()
  })(),
  'rehydration.b': (function() {
    const git = new TestGitBuilder()
    git.addCommit({ id: 'a1', parentId: 'root' })
    git.addCommit({ id: 'b1', parentId: 'root' })
    git.addMerge({ id: 'm1', parentId1: 'root', parentId2: 'a1' })
    git.addMerge({ id: 'm2', parentId1: 'm1', parentId2: 'b1' })
    return git.getCommits()
  })(),
  'rehydration.c': (function() {
    const git = new TestGitBuilder()
    git.addCommit({ id: 'a1', parentId: 'root' })
    git.addCommit({ id: 'b1', parentId: 'root' })
    git.addMerge({ id: 'm1', parentId1: 'root', parentId2: 'b1' })
    git.addCommit({ id: 'a2', parentId: 'a1' })
    git.addCommit({ id: 'c1', parentId: 'm1' })
    git.addMerge({ id: 'm2', parentId1: 'm1', parentId2: 'a2' })
    git.addMerge({ id: 'm3', parentId1: 'm2', parentId2: 'c1' })
    return git.getCommits()
  })(),
}
