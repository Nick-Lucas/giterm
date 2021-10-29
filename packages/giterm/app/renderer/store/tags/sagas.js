import { takeLatest, select, call, put } from 'redux-saga/effects'
import { tagsUpdated } from './actions'
import { GIT_REFS_CHANGED } from 'app/store/emitters/actions'
import { CWD_UPDATED } from 'app/store/config/actions'
import { CORE_INIT } from 'app/store/core/actions'
import { sentrySafeWrapper } from 'app/store/helpers'
import { GitWorker } from 'main/git-worker'

function* updateTags() {
  const cwd = yield select((state) => state.config.cwd)

  const tags = yield call(() => GitWorker.refs.getAllTags(cwd))

  yield put(tagsUpdated(tags))
}

export function* watch() {
  yield takeLatest(
    [CORE_INIT, GIT_REFS_CHANGED, CWD_UPDATED],
    sentrySafeWrapper(updateTags),
  )
}
