import { takeLatest, call, put, select } from 'redux-saga/effects'
import { commitsUpdated, REACHED_END_OF_LIST, CHECKOUT_COMMIT } from './actions'

import { SHOW_REMOTE_BRANCHES, CWD_UPDATED } from '../config/actions'
import { GIT_REFS_CHANGED } from '../emitters/actions'
import { Git } from '../../lib/git'
import { CORE_INIT } from '../core/actions'

function* reloadCommits() {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const { showRemoteBranches } = yield select((state) => state.config)
  const { commits: existingCommits, numberToLoad } = yield select(
    (state) => state.commits,
  )

  const [commits, digest] = yield call(() =>
    git.loadAllCommits(
      showRemoteBranches,
      existingCommits.length,
      numberToLoad - existingCommits.length,
    ),
  )

  yield put(commitsUpdated([...existingCommits, ...commits], digest))
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
      GIT_REFS_CHANGED,
      CWD_UPDATED,
      REACHED_END_OF_LIST,
      SHOW_REMOTE_BRANCHES,
    ],
    reloadCommits,
  )
  yield takeLatest([CHECKOUT_COMMIT], checkoutCommit)
}
