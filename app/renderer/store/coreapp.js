import { doUpdateCommits } from './commits'
import { doUpdateBranches } from './branches'
import { doStatusUpdate } from './status'

export const refreshApplication = (gitService) => {
  return async (dispatch) => {
    await Promise.all([
      dispatch(doUpdateCommits(gitService)),
      dispatch(doUpdateBranches(gitService)),
      dispatch(doStatusUpdate(gitService)),
    ])
  }
}
