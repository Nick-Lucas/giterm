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

export function doStatusUpdate() {
  return async (dispatch) => {
    const path = join(process.cwd(), '../domain-store')
    const repo = await git.openRepo(path)
    const branch = await git.getCurrentBranchHead(repo)
    const status = git.getStateText(repo)
    const action = statusUpdate(branch.name, branch.commitSHA, status)
    await dispatch(action)
  }
}

export default updateReducer(STATUS_UPDATE, {})
