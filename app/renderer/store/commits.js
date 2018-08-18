import { updateReducer } from './helpers'
import { refreshApplication } from './coreapp'

export const COMMITS_UPDATE = 'commits/update'

export const doUpdateCommits = (gitService) => {
  return async (dispatch, getState) => {
    const { showRemoteBranches } = getState().config
    const commits = await gitService.loadAllCommits(showRemoteBranches)
    await dispatch({
      type: COMMITS_UPDATE,
      payload: commits,
    })
  }
}

export const checkoutCommit = (gitService, commit) => {
  return async (dispatch) => {
    await gitService.checkout(commit.sha)
    await dispatch(refreshApplication(gitService))
  }
}

export default updateReducer(COMMITS_UPDATE, [])
