import { updateReducer } from './helpers'
import { commitsToGraph } from '../lib/gitgraph'
import _ from 'lodash'

export const GRAPH_UPDATE = 'graph/update'
export const GRAPH_UPDATE_SKIPPED = 'graph/update_skipped'

export const doUpdateGraph = () => {
  return async (dispatch, getState) => {
    const {
      commits: { commits, digest },
      graph,
    } = getState()

    if (digest === graph.holistics.digest) {
      dispatch({ type: GRAPH_UPDATE_SKIPPED })
      return
    }

    const remainingCommits = _.slice(commits, graph.length)
    // _.sortBy(commits, (c) => c)
    const { nodes, links, rehydrationPackage } = commitsToGraph(
      remainingCommits,
      graph.rehydrationPackage,
    )

    dispatch({
      type: GRAPH_UPDATE,
      payload: {
        holistics: {
          digest,
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
