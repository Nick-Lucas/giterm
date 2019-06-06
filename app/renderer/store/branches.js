import { updateReducer } from './helpers'

export const BRANCHES_UPDATE = 'branches/update'

export const doUpdateBranches = () => {
  return async (dispatch, _, { git }) => {
    const branches = await git.getAllBranches()
    dispatch({
      type: BRANCHES_UPDATE,
      payload: branches,
    })
  }
}

export default updateReducer(BRANCHES_UPDATE, [])
