import { StatusFile } from '@giterm/git'
import { updateReducer } from 'app/store/helpers'
import { STATUS_UPDATED } from './actions'

export interface StatusReducer {
  files: StatusFile[]
  state: string
  headSHA: string
  headBranch: string
}

const initialState: StatusReducer = {
  files: [],
  state: '',
  headSHA: '',
  headBranch: '',
}

export const reducer = updateReducer<StatusReducer>(
  STATUS_UPDATED,
  initialState,
)
