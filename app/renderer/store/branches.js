import { openRepo } from '../lib/git'
import * as git from '../lib/git'

import { join } from 'path'
import { updateReducer } from './helpers'

export const BRANCHES_UPDATE = 'branches/update'

export const doUpdateBranches = (gitService) => {
  return async (dispatch) => {
    const branches = await gitService.getAllBranches()
    await dispatch({
      type: BRANCHES_UPDATE,
      payload: branches,
    })
  }
}

export default updateReducer(BRANCHES_UPDATE, [])
