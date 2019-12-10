import { TestGitBuilder } from "./GitGraphRenderLib/TestGitBuilder";

const git = new TestGitBuilder()

git.addCommit({ id: 'a1', parentId: 'root' })
git.addCommit({ id: 'b1', parentId: 'root' })
git.addMerge({ id: 'm1', parentId1: 'root', parentId2: 'b1' })
git.addCommit({ id: 'a2', parentId: 'a1' })
git.addCommit({ id: 'c1', parentId: 'm1' })
git.addMerge({ id: 'm2', parentId1: 'm1', parentId2: 'a2' })
git.addMerge({ id: 'm3', parentId1: 'm2', parentId2: 'c1' })

export const data = {
  commits: git.getCommits()
  // commits: [
  //   {
  //     sha: 'f1',
  //     sha7: 'f1',
  //     parents: [
  //       'e1'
  //     ]
  //   },
  //   {
  //     sha: 'e2',
  //     sha7: 'e2',
  //     parents: [
  //       'e1'
  //     ]
  //   },
  //   {
  //     sha: 'root1',
  //     sha7: 'root1',
  //     parents: [
  //       'root',
  //       'a1'
  //     ]
  //   },
  //   {
  //     sha: 'e1',
  //     sha7: 'e1',
  //     parents: [
  //       'a1',
  //       'root'
  //     ]
  //   },
  //   {
  //     sha: 'a1',
  //     sha7: 'a1',
  //     parents: [
  //       'root'
  //     ]
  //   },
  //   {
  //     sha: 'root',
  //     sha7: 'root',
  //     parents: []
  //   },
  // ],
  // commits: [
  //   {
  //     sha: 'a2',
  //     sha7: 'a2',
  //     parents: [
  //       'a1',
  //       'root1'
  //     ]
  //   },
  //   {
  //     sha: 'root1',
  //     sha7: 'root1',
  //     parents: [
  //       'root'
  //     ]
  //   },
  //   {
  //     sha: 'a1',
  //     sha7: 'a1',
  //     parents: [
  //       'root'
  //     ]
  //   },
  //   {
  //     sha: 'root',
  //     sha7: 'root',
  //     parents: []
  //   },
  // ]
}
