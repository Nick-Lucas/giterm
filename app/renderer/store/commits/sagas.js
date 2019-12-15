import { takeEvery, getContext, call, put, select } from 'redux-saga/effects'
import { commitsUpdated, LOAD_MORE_COMMITS, CHECKOUT_COMMIT } from './actions'
import { REFRESH_APPLICATION, refresh } from '../core/actions'
import { SHOW_REMOTE_BRANCHES } from '../config/actions'
import { TERMINAL_CHANGED } from '../terminal/actions'

function* reloadCommits() {
  const git = yield getContext('git')

  const { showRemoteBranches } = yield select((state) => state.config)
  const { numberToLoad } = yield select((state) => state.commits)

  const [commits, digest] = yield call(() =>
    git.loadAllCommits(showRemoteBranches, numberToLoad),
  )

  yield put(commitsUpdated(commits, digest))
}

function* checkoutCommit(action) {
  const git = yield getContext('git')

  const { sha } = action
  yield call(() => git.checkout(sha))
  yield put(refresh())
}

export function* watch() {
  yield takeEvery(
    [
      REFRESH_APPLICATION,
      LOAD_MORE_COMMITS,
      SHOW_REMOTE_BRANCHES,
      TERMINAL_CHANGED,
    ],
    reloadCommits,
  )
  yield takeEvery([CHECKOUT_COMMIT], checkoutCommit)
}
