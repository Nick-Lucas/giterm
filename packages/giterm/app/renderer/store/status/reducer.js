import { updateReducer } from 'app/store/helpers'
import { STATUS_UPDATED } from './actions'

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

export const reducer = updateReducer(STATUS_UPDATED, initialState)
