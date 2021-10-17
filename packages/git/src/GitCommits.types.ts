export interface Paging {
  start: number
  count: number
}

export interface LoadCommits {
  includeRemote: boolean
  paging: Paging
}

export interface Commit {
  sha: string
  sha7: string
  message: string
  dateISO: string
  email: string
  author: string
  authorStr: string
  parents: string[]
  isHead: boolean
}

export interface Commits {
  query: LoadCommits
  commits: Commit[]
  digest: string
}
