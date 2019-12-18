import { takeLatest, call, put, select } from 'redux-saga/effects'
import { commitsUpdated, LOAD_MORE_COMMITS, CHECKOUT_COMMIT } from './actions'

import { SHOW_REMOTE_BRANCHES, CWD_UPDATED } from '../config/actions'
import { TERMINAL_CHANGED } from '../terminal/actions'
import { Git } from '../../lib/git'
import { CORE_INIT } from '../core/actions'

function* reloadCommits() {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const { showRemoteBranches } = yield select((state) => state.config)
  const { numberToLoad } = yield select((state) => state.commits)

  const [commits, digest] = yield call(() =>
    git.loadAllCommits(showRemoteBranches, numberToLoad),
  )

  yield put(commitsUpdated(commits, digest))
}

function* checkoutCommit(action) {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const { sha } = action
  yield call(() => git.checkout(sha))
}

export function* watch() {
  yield takeLatest(
    [
      CORE_INIT,
      TERMINAL_CHANGED,
      CWD_UPDATED,
      LOAD_MORE_COMMITS,
      SHOW_REMOTE_BRANCHES,
    ],
    reloadCommits,
  )
  yield takeLatest([CHECKOUT_COMMIT], checkoutCommit)
}
