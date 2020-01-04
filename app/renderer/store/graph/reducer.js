import { updateReducer } from '../helpers'
import { GRAPH_UPDATED } from './actions'
import { GIT_REFS_CHANGED } from '../emitters/actions'

const initialState = {
  holistics: { digest: undefined, cwd: null, length: 0 },
  nodes: [],
  links: [],
  rehydrationPackage: undefined,
}
export const reducer = updateReducer(
  GRAPH_UPDATED,
  initialState,
  GIT_REFS_CHANGED,
)
