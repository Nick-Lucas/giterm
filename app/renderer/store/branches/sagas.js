import { takeLatest, select, call, put } from 'redux-saga/effects'
import { branchesUpdated } from './actions'
import { GIT_REFS_CHANGED, GIT_HEAD_CHANGED } from '../emitters/actions'
import { CWD_UPDATED } from '../config/actions'
import { Git } from '../../lib/git'
import { CORE_INIT } from '../core/actions'

function* updateBranches() {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const branches = yield call(() => git.getAllBranches())

  yield put(branchesUpdated(branches))
}

export function* watch() {
  yield takeLatest(
    [CORE_INIT, GIT_REFS_CHANGED, CWD_UPDATED, GIT_HEAD_CHANGED],
    updateBranches,
  )
}
