import { takeEvery, put, select } from 'redux-saga/effects'

import { graphUpdateSkipped, graphUpdated } from './actions'
import { commitsToGraph } from '@giterm/gitgraph'
import { COMMITS_UPDATED } from 'app/store/commits/actions'
import { sentrySafeWrapper } from 'app/store/helpers'
import { measure } from 'app/lib/profiling'
import { State } from 'app/store'

function* recalculateGraph(): any {
  const { commits, digest } = yield select((state) => state.commits)

  const currentGraph: State['graph'] = yield select((state) => state.graph)

  const commitsUnchanged = digest === currentGraph.holistics.digest
  if (commitsUnchanged || !commits || !commits.length) {
    yield put(graphUpdateSkipped())
    return
  }

  const graph = measure('calculate-graph', () =>
    commitsToGraph(
      commits,
    ),
  )

  yield put(graphUpdated({
    digest
  }, graph))
}

export function* watch() {
  yield takeEvery([COMMITS_UPDATED], sentrySafeWrapper(recalculateGraph))
}
