import { takeEvery, getContext, call, put } from 'redux-saga/effects'
import { statusUpdated } from './actions'
import { REFRESH_APPLICATION } from '../core/actions'
import { TERMINAL_CHANGED } from '../terminal/actions'

function* updateStatus() {
  const git = yield getContext('git')

  const state = yield call(() => git.getStateText())
  const status = yield call(() => git.getStatus())
  const headSHA = yield call(() => git.getHeadSHA())

  yield put(statusUpdated(status, state, headSHA))
}

export function* watch() {
  yield takeEvery([REFRESH_APPLICATION, TERMINAL_CHANGED], updateStatus)
}
