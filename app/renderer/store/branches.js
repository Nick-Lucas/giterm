import { openRepo } from '../lib/git'
import * as git from '../lib/git'

import { join } from 'path'
import { updateReducer } from './helpers'

export const BRANCHES_UPDATE = 'branches/update'

export const doUpdateBranches = () => {
  return async (dispatch) => {
    const path = join(process.cwd(), '../domain-store')
    const repo = await openRepo(path)
    const branches = await git.getAllBranches(repo)
    await dispatch({
      type: BRANCHES_UPDATE,
      payload: branches,
    })
  }
}

export default updateReducer(BRANCHES_UPDATE, [])
