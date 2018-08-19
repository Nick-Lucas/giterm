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

export const SET_TERMINAL_FULLSCREEN = 'config/set_terminal_fullscreen'
export const setTerminalFullscreen = (fullscreen) => ({
  type: SET_TERMINAL_FULLSCREEN,
  fullscreen,
})

export const FLIP_TERMINAL_FULLSCREEN = 'config/flip_terminal_fullscreen'
export const flipTerminalFullscreen = (fullscreen) => ({
  type: FLIP_TERMINAL_FULLSCREEN,
  fullscreen,
})

export const SHOW_REMOTE_BRANCHES = 'config/show_remote_branches'
export const showRemoteBranches = (show) => ({
  type: SHOW_REMOTE_BRANCHES,
  show,
})

const initialState = {
  terminalFullscreen: false,
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
    case FLIP_TERMINAL_FULLSCREEN: {
      return {
        ...state,
        terminalFullscreen: !state.terminalFullscreen,
      }
    }
    case SET_TERMINAL_FULLSCREEN: {
      return {
        ...state,
        terminalFullscreen: action.fullscreen,
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
