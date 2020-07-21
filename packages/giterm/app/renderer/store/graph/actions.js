export const GRAPH_UPDATED = 'graph/updated'
export const graphUpdated = (holistics, nodes, links, rehydrationPackage) => ({
  type: GRAPH_UPDATED,
  holistics,
  nodes,
  links,
  rehydrationPackage,
})

export const GRAPH_UPDATE_SKIPPED = 'graph/update_skipped'
export const graphUpdateSkipped = () => ({
  type: GRAPH_UPDATE_SKIPPED,
})
