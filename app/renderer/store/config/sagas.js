import { takeEvery, put, select } from 'redux-saga/effects'

import { CWD_UPDATED, cwdUpdated } from './actions'
import { refresh } from '../core/actions'
import { TERMINAL_CHANGED } from '../terminal/actions'

function* checkCwd(action) {
  const { cwd } = action
  const config = yield select((state) => state.config)

  if (cwd !== config.cwd) {
    yield put(cwdUpdated(cwd))
  }
}

export function* watch() {
  takeEvery([TERMINAL_CHANGED], checkCwd)
  takeEvery([CWD_UPDATED], function*() {
    yield put(refresh())
  })
}
