import { updateReducer } from 'app/store/helpers'
import { REMOTES_UPDATED } from './actions'

export const reducer = updateReducer(REMOTES_UPDATED, [])
