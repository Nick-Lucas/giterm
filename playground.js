const NodeGit = require('nodegit')

async function time(cb) {
  const start = Date.now()
  console.log('Start: ', start)
  await cb()
  console.log('End, took: ', Date.now() - start)
}

async function run() {
  const repo = await NodeGit.Repository.open('../vscode')

  function getWalker() {
    const walker = NodeGit.Revwalk.create(repo)
    walker.sorting(NodeGit.Revwalk.SORT.TOPOLOGICAL, NodeGit.Revwalk.SORT.TIME)
    walker.pushGlob('refs/heads/*')
    walker.pushGlob('refs/remotes/*')
    return walker
  }

  // const walker = getWalker()
  // await walker.fastWalk(5000)
  // console.log('Loaded oids')

  // // walker = getWalker()
  // const oids = await walker.fastWalk(5)
  // console.log({ oids: oids.map((o) => o.tostrS()) })

  let walker

  await time(async () => {
    walker = getWalker()
    const oids = await walker.fastWalk(2000000)
    console.log({ oids: oids.length })
  })

  // await time(async () => {
  //   walker = getWalker()
  //   const commits = (await walker.getCommits(200000)).map((commit) => ({
  //     sha: commit.sha(),
  //     parents: commit.parents().map((parent) => parent.tostrS()),
  //   }))
  //   console.log({ commits: commits.length })
  // })
}

run()
