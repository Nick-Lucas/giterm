import { takeLatest, put, call, select } from 'redux-saga/effects'

import { cwdUpdated } from './actions'
import { TERMINAL_CHANGED } from 'app/store/terminal/actions'
import { sentrySafeWrapper } from 'app/store/helpers'
import { GitWorker } from 'main/git-worker'

function* checkCwd(action) {
  const { cwd } = action
  const config = yield select((state) => state.config)

  if (cwd !== config.cwd) {
    yield put(cwdUpdated(cwd))

    // Optimise after telling the rest of the application to change CWD
    // This way future calls will be really fast though first load might have not an optimised cache yet
    yield call(() => GitWorker.utils.optimise(cwd, []))
  }
}

export function* watch() {
  yield takeLatest([TERMINAL_CHANGED], sentrySafeWrapper(checkCwd))
}
