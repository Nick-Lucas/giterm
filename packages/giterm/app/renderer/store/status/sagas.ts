import { takeLatest, select, call, put } from 'redux-saga/effects'
import { statusUpdated } from './actions'
import { TERMINAL_CHANGED } from 'app/store/terminal/actions'
import { GIT_REFS_CHANGED } from 'app/store/emitters/actions'
import { CWD_UPDATED } from 'app/store/config/actions'
import { Git, StatusFile } from '@giterm/git'
import { CORE_INIT } from 'app/store/core/actions'
import { sentrySafeWrapper } from 'app/store/helpers'

import { Worker } from 'main/git-worker'

function* updateStatus(): any {
  const cwd: string = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const state: string = yield call(() => git.getStateText())
  const files: StatusFile[] = yield call(() => Worker.getStatus(cwd, []))
  const headSHA: string = yield call(() => git.getHeadSHA())

  yield put(statusUpdated(files, state, headSHA))
}

export function* watch() {
  yield takeLatest(
    [CORE_INIT, CWD_UPDATED, TERMINAL_CHANGED, GIT_REFS_CHANGED],
    sentrySafeWrapper(updateStatus),
  )
}
