import { TestGitBuilder } from './TestGitBuilder'

describe('TestGitBuilder', () => {
  it('should display the default head', () => {
    const git = new TestGitBuilder()
    expect(git._commits.length).toBe(1)
    expect(git._commits[0]._id).toBe('root')
  })

  it('should display a simple branching & merging structure', () => {
    const git = new TestGitBuilder()
    const { sha: branch1Sha } = git.addCommit({
      id: 'branch1',
      parentId: 'root',
    })
    const { sha: branch2Sha } = git.addCommit({
      id: 'branch2',
      parentId: 'root',
    })
    git.addMerge({ id: 'head', parentId1: 'branch1', parentId2: 'branch2' })

    const commits = git.getCommits()
    expect(commits.length).toBe(4)
    expect(commits.map((c) => c._id)).toEqual([
      'head',
      'branch2',
      'branch1',
      'root',
    ])

    // Check parent order integrity
    expect(commits[0].parents).toEqual([branch1Sha, branch2Sha])
    expect(commits[0].parents).not.toEqual([branch2Sha, branch1Sha])
  })
})
