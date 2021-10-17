import { GraphResponse } from '@giterm/gitgraph'
import { Holistic } from './types'

export const GRAPH_UPDATED = 'graph/updated'
export const graphUpdated = (holistics: Holistic, graph: GraphResponse) => ({
  type: GRAPH_UPDATED,
  holistics,
  graph,
})

export const GRAPH_UPDATE_SKIPPED = 'graph/update_skipped'
export const graphUpdateSkipped = () => ({
  type: GRAPH_UPDATE_SKIPPED,
})
