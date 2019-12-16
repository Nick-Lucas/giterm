import { takeEvery, put } from 'redux-saga/effects'

import { refresh } from './actions'
import { CWD_UPDATED } from '../config/actions'

export function* watch() {
  takeEvery([CWD_UPDATED], function*() {
    yield put(refresh())
  })
}
