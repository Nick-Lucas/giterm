export type RefSort = 'refname' | '-committerdate'

export interface GetBranchRefs {
  type: 'branches'
  filter: 'all' | 'local' | 'remote'
  sort?: RefSort
  limit?: number
}

export interface GetTagRefs {
  type: 'tags'
  sort?: RefSort
  limit?: number
}

export interface RefLocal {
  id: string
  name: string
}

export interface RefRemote {
  sha?: string
  id: string
  name: string
  ahead: number
  behind: number
}

export interface BranchRef {
  isHead: boolean
  sha: string
  local?: RefLocal
  authorDate: string
  commitDate: string
  upstream?: RefRemote
}

export interface TagRef {
  id: string
  name: string
  sha: string
  commitDate: string
  authorDate: string
}

export interface BranchRefs {
  type: 'branches'
  query: GetBranchRefs
  refs: BranchRef[]
}

export interface TagRefs {
  type: 'tags'
  query: GetTagRefs
  refs: TagRef[]
}

export type GetRefsFunc = {
  (query: GetTagRefs): Promise<TagRefs>
  (query: GetBranchRefs): Promise<BranchRefs>
}
