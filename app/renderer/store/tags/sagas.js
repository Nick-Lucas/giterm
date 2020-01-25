import { takeLatest, select, call, put } from 'redux-saga/effects'
import { tagsUpdated } from './actions'
import { GIT_REFS_CHANGED } from '../emitters/actions'
import { CWD_UPDATED } from '../config/actions'
import { Git } from '../../lib/git'
import { CORE_INIT } from '../core/actions'

function* updateTags() {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const tags = yield call(() => git.getAllTags())

  yield put(tagsUpdated(tags))
}

export function* watch() {
  yield takeLatest([CORE_INIT, GIT_REFS_CHANGED, CWD_UPDATED], updateTags)
}
