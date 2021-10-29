import { takeLatest, select, call, put } from 'redux-saga/effects'
import { remotesUpdated } from './actions'
import { GIT_REFS_CHANGED } from 'app/store/emitters/actions'
import { CWD_UPDATED } from 'app/store/config/actions'
import { Remote } from '@giterm/git'
import { CORE_INIT } from 'app/store/core/actions'
import { sentrySafeWrapper } from 'app/store/helpers'
import { State } from 'app/store'
import { Worker } from 'main/git-worker'

function* updateRemotes(): any {
  const cwd: string = yield select((state: State) => state.config.cwd)

  const remotes: Remote[] = yield call(() => Worker.getAllRemotes(cwd, []))

  yield put(remotesUpdated(remotes))
}

export function* watch() {
  yield takeLatest(
    [CORE_INIT, GIT_REFS_CHANGED, CWD_UPDATED],
    sentrySafeWrapper(updateRemotes),
  )
}
