import { GRAPH_UPDATED, graphUpdated } from './actions'

import { GraphResponse } from '@giterm/gitgraph'
import { Holistic } from './types'

export interface GraphReducer {
  holistics: Holistic
  nodes: GraphResponse['nodes']
  links: GraphResponse['links']
  rehydrationPackage?: GraphResponse['rehydrationPackage']
  width: number
}

const initialState: GraphReducer = {
  holistics: { digest: undefined },
  nodes: [],
  links: [],
  rehydrationPackage: undefined,
  width: 0
}

export function reducer(state = initialState, action: any): GraphReducer {
  switch (action.type) {
    case GRAPH_UPDATED: {
      const { graph, holistics } = action as ReturnType<typeof graphUpdated>

      return {
        holistics: holistics,
        nodes: graph.nodes,
        links: graph.links,
        rehydrationPackage: graph.rehydrationPackage,
        width: graph.nodes.reduce((max, node) => Math.max(node.column + 1, max), 3),
      }
    }

    default:
      return state
  }
}
