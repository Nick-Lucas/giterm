import { doUpdateCommits } from './commits'

export const updateShowRemoteBranches = (show, gitService) => (dispatch) => {
  dispatch(showRemoteBranches(show))
  dispatch(doUpdateCommits(gitService))
}

export const UPDATE_CWD = 'config/update_cwd'
export const updateCwd = (cwd) => ({
  type: UPDATE_CWD,
  payload: cwd.trim(),
})

export const SHOW_REMOTE_BRANCHES = 'config/show_remote_branches'
export const showRemoteBranches = (show) => ({
  type: SHOW_REMOTE_BRANCHES,
  show,
})

const initialState = {
  cwd: '',

  // Show data from remotes
  showRemoteBranches: true,
}

export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_CWD: {
      return {
        ...state,
        cwd: action.payload,
      }
    }
    case SHOW_REMOTE_BRANCHES: {
      return {
        ...state,
        showRemoteBranches: action.show,
      }
    }
    default: {
      return state
    }
  }
}
