import { doUpdateCommits } from './commits'
import { doUpdateBranches } from './branches'
import { doStatusUpdate } from './status'
import { updateReducer } from './helpers'

export const refreshApplication = () => {
  return async (dispatch) => {
    await Promise.all(
      dispatchAll(dispatch, [
        doUpdateCommits,
        doUpdateBranches,
        doStatusUpdate,
      ]),
    )
  }
}

function dispatchAll(dispatch, funcs) {
  return funcs.map((func) => dispatch(func()))
}
