export const UPDATE_CWD = 'config/update_cwd'
export const updateCwd = (cwd) => ({
  type: UPDATE_CWD,
  cwd: cwd.trim(),
})

export const SHOW_REMOTE_BRANCHES = 'config/show_remote_branches'
export const showRemoteBranches = (show) => ({
  type: SHOW_REMOTE_BRANCHES,
  show,
})
