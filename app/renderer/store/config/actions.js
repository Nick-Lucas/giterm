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
