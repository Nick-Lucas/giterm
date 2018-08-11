import * as git from '../lib/git'
import { join } from 'path'
import { updateReducer } from './helpers'

export const STATUS_UPDATE = 'status/update'

export const statusUpdate = (branchName, commit, status) => ({
  type: STATUS_UPDATE,
  payload: {
    branchName,
    commit,
    status,
  },
})

export function doStatusUpdate(gitService) {
  return async (dispatch) => {
    const branch = await gitService.getCurrentBranchHead()
    const status = await gitService.getStateText()
    const action = statusUpdate(branch.name, branch.commitSHA, status)
    await dispatch(action)
  }
}

export default updateReducer(STATUS_UPDATE, {})
