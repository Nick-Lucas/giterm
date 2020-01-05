import { SHOW_REMOTE_BRANCHES, CWD_UPDATED } from './actions'

import { INITIAL_CWD } from '../../lib/cwd'

const initialState = {
  cwd: INITIAL_CWD,

  // Show data from remotes
  showRemoteBranches: true,
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case CWD_UPDATED: {
      const { cwd } = action

      return {
        ...state,
        cwd,
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
