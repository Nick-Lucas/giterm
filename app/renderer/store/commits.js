import { openRepo, loadAllCommits } from '../lib/git'
import * as git from '../lib/git'

import { join } from 'path'

export const COMMITS_UPDATE = 'commits/update'

export const loadCommits = () => {
  return async (dispatch) => {
    const path = join(process.cwd(), '../domain-store')
    const repo = await openRepo(path)
    const commits = await loadAllCommits(repo)
    const bs = await git.getAllBranches(repo)
    console.log(bs.map((ref) => ref.name()))
    await dispatch({
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
