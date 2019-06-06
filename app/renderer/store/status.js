import { updateReducer } from './helpers'

export const STATUS_UPDATE = 'status/update'

export const statusUpdate = (status, state, headSHA) => ({
  type: STATUS_UPDATE,
  payload: {
    ...status,
    state,
    headSHA,
  },
})

export function doStatusUpdate() {
  return async (dispatch, _, { git }) => {
    const state = await git.getStateText()
    const status = await git.getStatus()
    const headSHA = await git.getHeadSHA()
    const action = statusUpdate(status, state, headSHA)
    dispatch(action)
  }
}

const initialState = {
  not_added: [],
  conflicted: [],
  created: [],
  deleted: [],
  modified: [],
  renamed: [],
  files: [],
  staged: [],
  ahead: 0,
  behind: 0,
  current: '',
  tracking: '',
  state: '',
}

export default updateReducer(STATUS_UPDATE, initialState)
