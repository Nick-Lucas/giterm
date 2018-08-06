import NodeGit from 'nodegit'
import DateFormat from 'dateformat'

export async function openRepo(workingDir) {
  return await NodeGit.Repository.open(workingDir)
}

export function getStateText(repo) {
  if (repo.isRebasing()) {
    return 'Rebasing'
  }
  if (repo.isMerging()) {
    return 'Merging'
  }
  if (repo.isCherrypicking()) {
    return 'Cherry Picking'
  }
  if (repo.isReverting()) {
    return 'Reverting'
  }
  if (repo.isBisecting()) {
    return 'Bisecting'
  }
  if (repo.isApplyingMailbox()) {
    return 'Applying Mailbox'
  }
  return 'OK'
}

export async function getCurrentBranchHead(repo) {
  const ref = await repo.getCurrentBranch()
  const commit = await repo.getBranchCommit(ref)
  return {
    name: ref.shorthand(),
    commitSHA: commit.sha(),
  }
}

export async function getAllBranches(repo, isRemote = false) {
  const refs = await repo.getReferences(NodeGit.Reference.TYPE.OID)
  return refs.filter((ref) => ref.isBranch()).map((ref) => ({
    name: ref.shorthand(),
    isRemote: !!ref.isRemote(),
    isHead: !!ref.isHead(),
    id: ref.name(),
  }))
}

export async function loadAllCommits(repo) {
  if (repo && window) {
    const headSHA = (await repo.head()).target().toString()

    const walker = NodeGit.Revwalk.create(repo)
    walker.sorting(NodeGit.Revwalk.SORT.TOPOLOGICAL, NodeGit.Revwalk.SORT.TIME)
    walker.pushGlob('*')
    const stashes = []
    return NodeGit.Stash.foreach(repo, (index, msg, id) => {
      stashes.push(id.toString())
      walker.push(id)
    }).then(() => {
      return walker.getCommits(500).then((res) => {
        const commits = []
        const stashIndicies = []
        res.forEach((x) => {
          let stashIndex = -1
          let isStash = false
          let parents = x.parents().map((p) => p.toString())
          if (stashes.indexOf(x.sha()) !== -1) {
            isStash = true
            parents = [x.parents()[0].toString()]
            if (x.parents().length > 0) {
              for (let i = 1; i < x.parents().length; i++) {
                stashIndicies.push(x.parents()[i].toString())
              }
            }
            stashIndex = stashes.indexOf(x.sha())
          }
          const cmt = {
            sha: x.sha(),
            sha7: x.sha().substring(0, 6),
            message: x.message().split('\n')[0],
            detail: x
              .message()
              .split('\n')
              .splice(1, x.message().split('\n').length)
              .join('\n'),
            date: x.date(),
            dateStr: DateFormat(x.date(), 'yyyy/mm/dd hh:MM'),
            time: x.time(),
            committer: x.committer(),
            email: x.author().email(),
            author: x.author().name(),
            authorStr: `${x.author().name()} <${x.author().email()}>`,
            parents: parents,
            isStash: isStash,
            stashIndex: stashIndex,
            isHead: headSHA === x.sha(),
          }
          if (stashIndicies.indexOf(cmt.sha) === -1) {
            commits.push(cmt)
          }
        })
        return commits
      })
    })
  } else {
    return Promise.reject('NO_REPO')
  }
}
