import { refreshApplication } from './coreapp'
import { doUpdateGraph } from './graph'

export const COMMITS_UPDATE = 'commits/update'
export const LOAD_MORE_COMMITS = 'commits/load_more'

export const doUpdateCommits = (gitService) => {
  return async (dispatch, getState) => {
    const {
      config: { showRemoteBranches },
      commits: { numberToLoad },
    } = getState()

    const commits = await gitService.loadAllCommits(
      showRemoteBranches,
      numberToLoad,
    )

    dispatch({
      type: COMMITS_UPDATE,
      payload: commits,
    })
    dispatch(doUpdateGraph())
  }
}

export const loadMoreCommits = (gitService) => {
  return (dispatch, getState) => {
    const { commits } = getState()
    if (!commits || commits.commits === null) {
      return
    }
    if (commits.numberToLoad <= commits.commits.length) {
      dispatch({ type: LOAD_MORE_COMMITS })
      dispatch(doUpdateCommits(gitService))
    }
  }
}

export const checkoutCommit = (gitService, commit) => {
  return async (dispatch) => {
    await gitService.checkout(commit.sha)
    dispatch(refreshApplication(gitService))
  }
}

const initialState = {
  numberToLoad: 500,
  commits: [],
}

export default (state = initialState, action) => {
  switch (action.type) {
    case COMMITS_UPDATE:
      return {
        ...state,
        commits: action.payload,
      }
    case LOAD_MORE_COMMITS:
      return {
        ...state,
        numberToLoad: state.numberToLoad + 500,
      }
    default:
      return state
  }
}
