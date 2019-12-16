import { takeEvery, put, select } from 'redux-saga/effects'

import { cwdUpdated } from './actions'
import { TERMINAL_CHANGED } from '../terminal/actions'

function* checkCwd(action) {
  const { cwd } = action
  const config = yield select((state) => state.config)

  if (cwd !== config.cwd) {
    yield put(cwdUpdated(cwd))
  }
}

export function* watch() {
  yield takeEvery([TERMINAL_CHANGED], checkCwd)
}
