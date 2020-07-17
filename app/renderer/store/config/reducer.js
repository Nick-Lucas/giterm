import { SHOW_REMOTE_BRANCHES, SHOW_BRANCH_TAGS, CWD_UPDATED } from './actions'

import { INITIAL_CWD } from '../../lib/cwd'

const initialState = {
  cwd: INITIAL_CWD,

  // Show data from remotes
  showRemoteBranches: true,

  // Show tags on the commits list
  showBranchTags: true,
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
    case SHOW_BRANCH_TAGS: {
      return {
        ...state,
        showBranchTags: action.show,
      }
    }
    default: {
      return state
    }
  }
}
