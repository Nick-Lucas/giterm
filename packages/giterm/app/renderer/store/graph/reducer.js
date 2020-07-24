import { updateReducer } from 'app/store/helpers'
import { GRAPH_UPDATED } from './actions'

const initialState = {
  holistics: { digest: undefined, cwd: null, length: 0 },
  nodes: [],
  links: [],
  rehydrationPackage: undefined,
}
export const reducer = updateReducer(GRAPH_UPDATED, initialState)
