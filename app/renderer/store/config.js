export const UPDATE_CWD = 'config/update_cwd'
export const updateCwd = (cwd) => ({
  type: UPDATE_CWD,
  payload: cwd.trim(),
})

export const FLIP_TERMINAL_FULLSCREEN = 'config/flip_terminal_fullscreen'
export const flipTerminalFullscreen = () => ({
  type: FLIP_TERMINAL_FULLSCREEN,
})

const initialState = {
  terminalFullscreen: false,
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
    default: {
      return state
    }
  }
}
