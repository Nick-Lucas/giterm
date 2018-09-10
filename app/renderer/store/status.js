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

export function doStatusUpdate(gitService) {
  return async (dispatch) => {
    const state = await gitService.getStateText()
    const status = await gitService.getStatus()
    const headSHA = await gitService.getHeadSHA()
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
