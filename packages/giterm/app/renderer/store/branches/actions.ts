import { BranchRefs } from '@giterm/git'

export const BRANCHES_UPDATED = 'branches/updated'

export const branchesUpdated = (branches: BranchRefs) => ({
  type: BRANCHES_UPDATED,
  branches,
})
