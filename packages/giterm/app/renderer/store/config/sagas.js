import { takeLatest, put, select } from 'redux-saga/effects'

import { cwdUpdated } from './actions'
import { TERMINAL_CHANGED } from 'app/store/terminal/actions'
import { sentrySafeWrapper } from 'app/store/helpers'

function* checkCwd(action) {
  const { cwd } = action
  const config = yield select((state) => state.config)

  if (cwd !== config.cwd) {
    yield put(cwdUpdated(cwd))
  }
}

export function* watch() {
  yield takeLatest([TERMINAL_CHANGED], sentrySafeWrapper(checkCwd))
}
