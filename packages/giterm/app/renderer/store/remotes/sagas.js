import { takeLatest, select, call, put } from 'redux-saga/effects'
import { remotesUpdated } from './actions'
import { GIT_REFS_CHANGED } from '../emitters/actions'
import { CWD_UPDATED } from '../config/actions'
import { Git } from '@giterm/git'
import { CORE_INIT } from '../core/actions'

function* updateRemotes() {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const remotes = yield call(() => git.getAllRemotes())

  yield put(remotesUpdated(remotes))
}

export function* watch() {
  yield takeLatest([CORE_INIT, GIT_REFS_CHANGED, CWD_UPDATED], updateRemotes)
}
