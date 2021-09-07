import { takeLatest, call, put, select } from 'redux-saga/effects'
import { commitsUpdated, REACHED_END_OF_LIST } from './actions'

import { SHOW_REMOTE_BRANCHES, CWD_UPDATED } from 'app/store/config/actions'
import { GIT_REFS_CHANGED } from 'app/store/emitters/actions'
import { Git } from '@giterm/git'
import { CORE_INIT } from 'app/store/core/actions'
import { sentrySafeWrapper } from 'app/store/helpers'
import { measure } from 'app/lib/profiling'

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
    measure('load-commits', () =>
      git.loadAllCommits(
        showRemoteBranches,
        reloadAll ? 0 : existingCommits.length,
        reloadAll ? numberToLoad : numberToLoad - existingCommits.length,
      ),
    ),
  )

  const nextCommits = reloadAll ? commits : [...existingCommits, ...commits]

  yield put(commitsUpdated(nextCommits, digest))
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
    sentrySafeWrapper(reloadCommits),
  )
}
