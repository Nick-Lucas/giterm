import { takeLatest, select, call, put, all } from 'redux-saga/effects'
import { statusUpdated } from './actions'
import { TERMINAL_CHANGED } from 'app/store/terminal/actions'
import { GIT_REFS_CHANGED } from 'app/store/emitters/actions'
import { CWD_UPDATED } from 'app/store/config/actions'
import { StatusFile } from '@giterm/git'
import { CORE_INIT } from 'app/store/core/actions'
import { sentrySafeWrapper } from 'app/store/helpers'

import { GitWorker } from 'main/git-worker'

function* updateStatus(): any {
  const cwd: string = yield select((state) => state.config.cwd)

  const [state, files, headSHA, headBranch]: [
    state: string,
    files: StatusFile[],
    headSHA: string,
    headBranch: string,
  ] = yield all([
    call(() => GitWorker.getStateText(cwd, [])),
    call(() => GitWorker.getStatus(cwd, [])),
    call(() => GitWorker.getHeadSha(cwd, [])),
    call(() => GitWorker.getHeadBranch(cwd, [])),
  ])

  yield put(statusUpdated(files, state, headSHA, headBranch))
}

export function* watch() {
  yield takeLatest(
    [CORE_INIT, CWD_UPDATED, TERMINAL_CHANGED, GIT_REFS_CHANGED],
    sentrySafeWrapper(updateStatus),
  )
}
