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

    if (digest === graph.holistics.digest) {
      dispatch({ type: GRAPH_UPDATE_SKIPPED })
      return
    }

    const remainingCommits =
      cwd === graph.cwd ? commits.slice(graph.length) : commits

    const { nodes, links, rehydrationPackage } = commitsToGraph(
      remainingCommits,
      cwd === graph.cwd ? graph.rehydrationPackage : undefined,
    )

    dispatch({
      type: GRAPH_UPDATE,
      payload: {
        holistics: {
          digest,
          cwd,
        },
        length: commits.length,
        nodes,
        links,
        rehydrationPackage,
      },
    })
  }
}

const initialState = {
  holistics: { digest: undefined },
  length: 0,
  nodes: [],
  links: [],
  rehydrationPackage: undefined,
}
export default updateReducer(GRAPH_UPDATE, initialState)
