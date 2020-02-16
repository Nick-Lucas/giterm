import { takeEvery, put, select } from 'redux-saga/effects'

import { graphUpdateSkipped, graphUpdated } from './actions'
import { commitsToGraph } from '../../lib/gitgraph'
import { COMMITS_UPDATED } from '../commits/actions'

function* recalculateGraph() {
  // const { cwd, showRemoteBranches } = yield select((state) => state.config)
  const { commits, digest } = yield select((state) => state.commits)

  const nextHolistics = {
    digest,
    // commitsAlreadyProcessed: commits.length,
    // rehydrationHolistics: {
    //   cwd,
    //   showRemoteBranches,
    // },
  }

  const graph = yield select((state) => state.graph)

  const commitsUnchanged = digest === graph.holistics.digest
  if (commitsUnchanged || !commits || !commits.length) {
    yield put(graphUpdateSkipped())
    return
  }

  // const shouldRehydrate = _.isEqual(
  //   graph.holistics.rehydrationHolistics,
  //   nextHolistics.rehydrationHolistics,
  // )
  // const unprocessedCommits = shouldRehydrate
  //   ? commits.slice(graph.holistics.commitsAlreadyProcessed)
  //   : commits
  // const currentRehydrationPackage = shouldRehydrate
  //   ? graph.rehydrationPackage
  //   : undefined

  const { nodes, links, rehydrationPackage } = commitsToGraph(
    commits, //unprocessedCommits,
    // currentRehydrationPackage,
  )

  yield put(graphUpdated(nextHolistics, nodes, links, rehydrationPackage))
}

export function* watch() {
  yield takeEvery([COMMITS_UPDATED], recalculateGraph)
}
