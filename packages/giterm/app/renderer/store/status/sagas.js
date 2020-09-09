import { takeLatest, select, call, put } from 'redux-saga/effects'
import { statusUpdated } from './actions'
import { TERMINAL_CHANGED } from 'app/store/terminal/actions'
import { GIT_REFS_CHANGED } from 'app/store/emitters/actions'
import { CWD_UPDATED } from 'app/store/config/actions'
import { Git } from '@giterm/git'
import { CORE_INIT } from 'app/store/core/actions'
import { sentrySafeWrapper } from 'app/store/helpers'

function* updateStatus() {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const state = yield call(() => git.getStateText())
  const files = yield call(() => git.getStatus())
  const headSHA = yield call(() => git.getHeadSHA())

  yield put(statusUpdated(files, state, headSHA))
}

export function* watch() {
  yield takeLatest(
    [CORE_INIT, CWD_UPDATED, TERMINAL_CHANGED, GIT_REFS_CHANGED],
    sentrySafeWrapper(updateStatus),
  )
}
