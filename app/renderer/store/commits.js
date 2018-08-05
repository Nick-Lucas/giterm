import { openRepo, loadAllCommits } from '../lib/git'

export const COMMITS_UPDATE = 'commits/update'

export const loadCommits = () => {
  return async (dispatch) => {
    const repo = await openRepo(process.cwd())
    const commits = await loadAllCommits(repo)
    dispatch({
      type: COMMITS_UPDATE,
      payload: commits,
    })
  }
}

const initialState = []
export default (state = initialState, action) => {
  switch (action.type) {
    case COMMITS_UPDATE: {
      return action.payload
    }
    default:
      return state
  }
}
