import { takeEvery, put } from 'redux-saga/effects'

import { UPDATE_CWD } from './actions'
import { refresh } from '../core/actions'

export function* watch() {
  takeEvery([UPDATE_CWD], function*() {
    yield put(refresh())
  })
}
