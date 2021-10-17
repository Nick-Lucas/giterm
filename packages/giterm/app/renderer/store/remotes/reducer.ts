import { Remote } from '@giterm/git'
import { updateReducer } from 'app/store/helpers'
import { REMOTES_UPDATED } from './actions'

export const reducer = updateReducer<Remote[]>(REMOTES_UPDATED, [])
