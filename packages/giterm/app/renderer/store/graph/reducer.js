import { GRAPH_UPDATED } from './actions'

const initialState = {
  holistics: { digest: undefined, cwd: null, length: 0 },
  nodes: [],
  links: [],
  rehydrationPackage: undefined,
}

export function reducer(state = initialState, action) {
  switch (action.type) {
    case GRAPH_UPDATED: {
      const { type, nodes, ...payload } = action

      return {
        nodes,
        ...payload,
        width: nodes.reduce((max, node) => Math.max(node.column + 1, max), 3),
      }
    }

    default:
      return state
  }
}
