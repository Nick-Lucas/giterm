import NodeGit from 'nodegit'
import SimpleGit from 'simple-git'
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

export async function getAllBranches(repo) {
  const refs = await repo.getReferences(NodeGit.Reference.TYPE.OID)
  return Promise.all(
    refs.filter((ref) => ref.isBranch()).map(async (ref) => {
      const headRef = await ref.peel(NodeGit.Object.TYPE.COMMIT)
      const head = await repo.getCommit(headRef)
      return {
        name: ref.shorthand(),
        isRemote: !!ref.isRemote(),
        isHead: !!ref.isHead(),
        id: ref.name(),
        headSHA: head.sha(),
      }
    }),
  )
}

export async function loadAllCommits(repo) {
  if (repo && window) {
    const headSHA = (await repo.head()).target().toString()

    const walker = NodeGit.Revwalk.create(repo)
    walker.sorting(NodeGit.Revwalk.SORT.TOPOLOGICAL, NodeGit.Revwalk.SORT.TIME)
    walker.pushGlob('refs/heads/*')

    const foundCommits = await walker.getCommits(500)
    const commits = []
    foundCommits.forEach((c) => {
      const cmt = {
        sha: c.sha(),
        sha7: c.sha().substring(0, 6),
        message: c.message().split('\n')[0],
        detail: c
          .message()
          .split('\n')
          .splice(1, c.message().split('\n').length)
          .join('\n'),
        date: c.date(),
        dateStr: DateFormat(c.date(), 'yyyy/mm/dd hh:MM'),
        time: c.time(),
        committer: c.committer(),
        email: c.author().email(),
        author: c.author().name(),
        authorStr: `${c.author().name()} <${c.author().email()}>`,
        parents: c.parents().map((p) => p.toString()),
        isHead: headSHA === c.sha(),
      }

      commits.push(cmt)
    })
    return commits
  } else {
    return Promise.reject('NO_REPO')
  }
}

export async function checkout(repo, sha) {
  const branches = await getAllBranches(repo)
  const branch = branches.reduce((out, b) => {
    if (!out && b.headSHA === sha) {
      return b.id
    }
    return out
  }, null)

  if (branch) {
    await repo.checkoutBranch(branch)
  } else {
    const git = SimpleGit('/Users/nick/dev/domain-store')
    await new Promise((resolve) => {
      git.checkout(sha, () => resolve())
    })
  }
}
