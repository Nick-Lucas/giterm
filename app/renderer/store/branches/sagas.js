import { takeEvery, getContext, call, put } from 'redux-saga/effects'
import { branchesUpdated } from './actions'
import { REFRESH_APPLICATION } from '../core/actions'
import { TERMINAL_CHANGED } from '../terminal/actions'

function* updateBranches() {
  const git = yield getContext('git')

  const branches = yield call(() => git.getAllBranches())
  yield put(branchesUpdated(branches))
}

export function* watch() {
  yield takeEvery([REFRESH_APPLICATION, TERMINAL_CHANGED], updateBranches)
}
