import { StatusFile } from '@giterm/git'
import { updateReducer } from 'app/store/helpers'
import { STATUS_UPDATED } from './actions'

export interface StatusReducer {
  files: StatusFile[],
  state: string,
  headSHA: string,
}

const initialState = {  
  files: [],
  state: '',
  headSHA: '',
}

export const reducer = updateReducer<StatusReducer>(STATUS_UPDATED, initialState)
