import NodeGit from 'nodegit'
import SimpleGit from 'simple-git'
import DateFormat from 'dateformat'

export async function openRepo(workingDir) {
  return await NodeGit.Repository.open(workingDir)
}

export class Git {
  constructor(cwd) {
    this.cwd = cwd
  }

  // instance management
  // **********************

  updateCwd = (newCwd) => {
    this.cwd = newCwd
    this._simple = null
    this._complex = null
  }

  getSimple = () => {
    if (!this._simple) {
      this._simple = SimpleGit(this.cwd)
    }
    return this._simple
  }

  getComplex = async () => {
    if (!this._complex) {
      this._complex = await NodeGit.Repository.open(this.cwd)
    }
    return this._complex
  }

  // methods
  // **********************

  async getStateText() {
    const repo = await this.getComplex()
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

  getCurrentBranchHead = async () => {
    const repo = await this.getComplex()
    const ref = await repo.getCurrentBranch()
    const commit = await repo.getBranchCommit(ref)
    return {
      name: ref.shorthand(),
      commitSHA: commit.sha(),
    }
  }

  getAllBranches = async () => {
    const repo = await this.getComplex()
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

  loadAllCommits = async () => {
    const repo = await this.getComplex()
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
  }

  checkout = async (sha) => {
    const repo = await this.getComplex()

    const branches = await this.getAllBranches(repo)
    const branch = branches.reduce((out, b) => {
      if (!out && b.headSHA === sha) {
        return b.id
      }
      return out
    }, null)

    if (branch) {
      await repo.checkoutBranch(branch)
    } else {
      const git = this.getSimple()
      await new Promise((resolve) => {
        git.checkout(sha, () => resolve())
      })
    }
  }
}
