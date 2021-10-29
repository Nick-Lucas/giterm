import { takeLatest, call, put, select } from 'redux-saga/effects'
import { commitsUpdated, REACHED_END_OF_LIST } from './actions'

import { SHOW_REMOTE_BRANCHES, CWD_UPDATED } from 'app/store/config/actions'
import { GIT_REFS_CHANGED } from 'app/store/emitters/actions'
import { Commits } from '@giterm/git'
import { CORE_INIT } from 'app/store/core/actions'
import { sentrySafeWrapper } from 'app/store/helpers'
import { State } from 'app/store'
import { GitWorker } from 'main/git-worker'

function* reloadCommits(action: any): any {
  const cwd = yield select((state: any) => state.config.cwd)

  const { showRemoteBranches } = yield select((state) => state.config)
  const { commits: existingCommits, numberToLoad }: State['commits'] =
    yield select((state: State) => state.commits)

  const reloadAll = [
    CWD_UPDATED,
    GIT_REFS_CHANGED,
    SHOW_REMOTE_BRANCHES,
  ].includes(action.type)

  const { commits, digest }: Commits = yield call(() =>
    GitWorker.commits.load(cwd, [
      {
        includeRemote: showRemoteBranches,
        paging: reloadAll
          ? {
              start: 0,
              count: numberToLoad,
            }
          : {
              start: existingCommits.length,
              count: numberToLoad - existingCommits.length,
            },
      },
    ]),
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
