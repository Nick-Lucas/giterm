import { takeLatest, select, call, put } from 'redux-saga/effects'
import { branchesUpdated } from './actions'
import { GIT_REFS_CHANGED, GIT_HEAD_CHANGED } from 'app/store/emitters/actions'
import { CWD_UPDATED } from 'app/store/config/actions'
import { CORE_INIT } from 'app/store/core/actions'
import { sentrySafeWrapper } from 'app/store/helpers'
import { Worker } from 'main/git-worker'

function* updateBranches(): any {
  const cwd = yield select((state) => state.config.cwd)

  const branches = yield call(() => Worker.refs.getAllBranches(cwd, []))

  yield put(branchesUpdated(branches))
}

export function* watch() {
  yield takeLatest(
    [CORE_INIT, GIT_REFS_CHANGED, CWD_UPDATED, GIT_HEAD_CHANGED],
    sentrySafeWrapper(updateBranches),
  )
}
