import { updateReducer } from '../helpers'
import { BRANCHES_UPDATED } from './actions'

export const reducer = updateReducer(BRANCHES_UPDATED, [])
