import { takeLatest, select, call, put } from 'redux-saga/effects'
import { statusUpdated } from './actions'
import { TERMINAL_CHANGED } from '../terminal/actions'
import { GIT_REFS_CHANGED } from '../emitters/actions'
import { CWD_UPDATED } from '../config/actions'
import { Git } from '../../lib/git'
import { CORE_INIT } from '../core/actions'

function* updateStatus() {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const state = yield call(() => git.getStateText())
  const status = yield call(() => git.getStatus())
  const headSHA = yield call(() => git.getHeadSHA())

  yield put(statusUpdated(status, state, headSHA))
}

export function* watch() {
  yield takeLatest(
    [CORE_INIT, CWD_UPDATED, TERMINAL_CHANGED, GIT_REFS_CHANGED],
    updateStatus,
  )
}
