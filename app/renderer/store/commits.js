import { openRepo, loadAllCommits } from '../lib/git'
import * as git from '../lib/git'

import { join } from 'path'
import { updateReducer } from './helpers'

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

export default updateReducer(COMMITS_UPDATE, [])
