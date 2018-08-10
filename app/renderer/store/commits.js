import { openRepo, loadAllCommits } from '../lib/git'
import * as git from '../lib/git'

import { join } from 'path'
import { updateReducer } from './helpers'
import { refreshApplication } from './coreapp'

export const COMMITS_UPDATE = 'commits/update'

export const doUpdateCommits = () => {
  return async (dispatch) => {
    const path = join(process.cwd(), '../domain-store')
    const repo = await openRepo(path)
    const commits = await loadAllCommits(repo)
    await dispatch({
      type: COMMITS_UPDATE,
      payload: commits,
    })
  }
}

export const checkoutCommit = (commit) => {
  return async (dispatch) => {
    const path = join(process.cwd(), '../domain-store')
    const repo = await openRepo(path)

    await git.checkout(repo, commit.sha)

    await dispatch(refreshApplication())
  }
}

export default updateReducer(COMMITS_UPDATE, [])
