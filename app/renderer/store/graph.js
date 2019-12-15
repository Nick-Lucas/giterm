import { updateReducer } from './helpers'
import { commitsToGraph } from '../lib/gitgraph'

export const GRAPH_UPDATE = 'graph/update'
export const GRAPH_UPDATE_SKIPPED = 'graph/update_skipped'

export const doUpdateGraph = () => {
  return async (dispatch, getState) => {
    const {
      config: { cwd },
      commits: { commits, digest },
      graph,
    } = getState()

    const projectUnchanged = cwd === graph.holistics.cwd
    const commitsUnchanged = digest === graph.holistics.digest

    if (commitsUnchanged) {
      dispatch({ type: GRAPH_UPDATE_SKIPPED })
      return
    }

    const remainingCommits = projectUnchanged
      ? commits.slice(graph.holistics.length)
      : commits
    const currentRehydrationPackage = projectUnchanged
      ? graph.rehydrationPackage
      : undefined

    const { nodes, links, rehydrationPackage } = commitsToGraph(
      remainingCommits,
      currentRehydrationPackage,
    )

    dispatch({
      type: GRAPH_UPDATE,
      payload: {
        holistics: {
          digest,
          cwd,
          length: commits.length,
        },
        nodes,
        links,
        rehydrationPackage,
      },
    })
  }
}

const initialState = {
  holistics: { digest: undefined, cwd: null, length: 0 },
  nodes: [],
  links: [],
  rehydrationPackage: undefined,
}
export default updateReducer(GRAPH_UPDATE, initialState)
