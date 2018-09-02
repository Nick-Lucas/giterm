import { updateReducer } from './helpers'

export const STATUS_UPDATE = 'status/update'

export const statusUpdate = (status, state) => ({
  type: STATUS_UPDATE,
  payload: {
    ...status,
    state,
  },
})

export function doStatusUpdate(gitService) {
  return async (dispatch) => {
    const state = await gitService.getStateText()
    const status = await gitService.getStatus()
    const action = statusUpdate(status, state)
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
