import {
  FLIP_USER_TERMINAL_FULLSCREEN,
  AUTO_TERMINAL_FULLSCREEN,
} from './actions'

export interface TerminalReducer {
  fullscreen: boolean
  userTerminalFullscreen: boolean
  autoTerminalFullscreen: boolean
}

const initialState: TerminalReducer = {
  // Calculated field based on user/auto properties
  fullscreen: false,

  // For the user toggle: takes precedence
  userTerminalFullscreen: false,

  // For auto changes: over-rides small panel, but not user fullscreen
  autoTerminalFullscreen: false,
}

export const reducer = (state = initialState, action: any): TerminalReducer => {
  switch (action.type) {
    case FLIP_USER_TERMINAL_FULLSCREEN: {
      const userNext = !state.fullscreen
      const autoNext = state.autoTerminalFullscreen
        ? userNext
        : state.autoTerminalFullscreen

      return {
        ...state,
        userTerminalFullscreen: userNext,
        autoTerminalFullscreen: autoNext,
        fullscreen: userNext || autoNext,
      }
    }

    case AUTO_TERMINAL_FULLSCREEN: {
      const autoNext = action.fullscreen

      return {
        ...state,
        autoTerminalFullscreen: autoNext,
        fullscreen: state.userTerminalFullscreen || autoNext,
      }
    }

    default: {
      return state
    }
  }
}
