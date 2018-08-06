import * as git from '../lib/git'
import { join } from 'path'

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

const initialState = []
export default (state = initialState, action) => {
  switch (action.type) {
    case STATUS_UPDATE: {
      return action.payload
    }
    default:
      return state
  }
}
