import { takeEvery, takeLatest, take, put, select } from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'

import { Git } from '@giterm/git'
import { CWD_UPDATED } from 'app/store/config/actions'
import { gitRefsChanged, gitHeadChanged } from './actions'
import { CORE_INIT } from 'app/store/core/actions'
import { STATUS_UPDATED } from 'app/store/status/actions'

function* listenForRefChanges() {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const refChangeEmitter = eventChannel((emit) => {
    return git.watchRefs((data) => {
      emit(data)
    })
  })

  while (true) {
    const { event, ref, isRemote } = yield take(refChangeEmitter)

    const { showRemoteBranches } = yield select((state) => state.config)
    if (isRemote && !showRemoteBranches) {
      // Hasn't actually changed visibly
      continue
    }

    yield put(gitRefsChanged(event, ref, isRemote))
  }
}

function* listenForHeadChanges() {
  while (true) {
    const lastHeadSHA = yield select((state) => state.status.headSHA)

    yield take(STATUS_UPDATED)

    const headSHA = yield select((state) => state.status.headSHA)
    if (lastHeadSHA !== headSHA) {
      yield put(gitHeadChanged(headSHA))
    }
  }
}

export function* watch() {
  yield takeLatest([CORE_INIT, CWD_UPDATED], listenForRefChanges)
  yield takeEvery([CORE_INIT], listenForHeadChanges)
}
