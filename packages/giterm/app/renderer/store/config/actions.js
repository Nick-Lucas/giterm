export const CWD_UPDATED = 'config/cwd_updated'
export const cwdUpdated = (cwd) => ({
  type: CWD_UPDATED,
  cwd: cwd.trim(),
})

export const SHOW_REMOTE_BRANCHES = 'config/show_remote_branches'
export const showRemoteBranches = (show) => ({
  type: SHOW_REMOTE_BRANCHES,
  show,
})

export const SHOW_BRANCH_TAGS = 'config/show_branch_tags'
export const showBranchTags = (show) => ({
  type: SHOW_BRANCH_TAGS,
  show,
})
