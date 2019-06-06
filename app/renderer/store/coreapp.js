import { doUpdateCommits } from './commits'
import { doUpdateBranches } from './branches'
import { doStatusUpdate } from './status'

export const refreshApplication = () => {
  return async (dispatch) => {
    dispatch(doUpdateCommits())
    dispatch(doUpdateBranches())
    dispatch(doStatusUpdate())
  }
}
