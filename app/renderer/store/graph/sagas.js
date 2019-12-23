import { takeEvery, put, select } from 'redux-saga/effects'
import { graphUpdateSkipped, graphUpdated } from './actions'
import { commitsToGraph } from '../../lib/gitgraph'
import { COMMITS_UPDATED } from '../commits/actions'

function* recalculateGraph() {
  const { cwd } = yield select((state) => state.config)
  const { commits, digest } = yield select((state) => state.commits)
  const graph = yield select((state) => state.graph)

  const projectChanged = cwd !== graph.holistics.cwd
  const commitsUnchanged = digest === graph.holistics.digest

  if (commitsUnchanged) {
    yield put(graphUpdateSkipped())
    return
  }

  const remainingCommits = projectChanged
    ? commits
    : commits.slice(graph.holistics.length)
  const currentRehydrationPackage = projectChanged
    ? undefined
    : graph.rehydrationPackage

  const { nodes, links, rehydrationPackage } = commitsToGraph(
    remainingCommits,
    currentRehydrationPackage,
  )

  const holistics = {
    digest,
    cwd,
    length: commits.length,
  }

  yield put(graphUpdated(holistics, nodes, links, rehydrationPackage))
}

export function* watch() {
  yield takeEvery([COMMITS_UPDATED], recalculateGraph)
}
