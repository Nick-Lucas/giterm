import { takeLatest, call, put, select } from 'redux-saga/effects'
import { commitsUpdated, REACHED_END_OF_LIST, CHECKOUT_COMMIT } from './actions'

import { SHOW_REMOTE_BRANCHES, CWD_UPDATED } from 'app/store/config/actions'
import { GIT_REFS_CHANGED } from 'app/store/emitters/actions'
import { Git } from '@giterm/git'
import { CORE_INIT } from 'app/store/core/actions'

function* reloadCommits(action) {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const { showRemoteBranches } = yield select((state) => state.config)
  const { commits: existingCommits, numberToLoad } = yield select(
    (state) => state.commits,
  )

  const reloadAll = [
    CWD_UPDATED,
    GIT_REFS_CHANGED,
    SHOW_REMOTE_BRANCHES,
  ].includes(action.type)

  const [commits, digest] = yield call(() =>
    git.loadAllCommits(
      showRemoteBranches,
      reloadAll ? 0 : existingCommits.length,
      reloadAll ? numberToLoad : numberToLoad - existingCommits.length,
    ),
  )

  const nextCommits = reloadAll ? commits : [...existingCommits, ...commits]

  yield put(commitsUpdated(nextCommits, digest))
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
