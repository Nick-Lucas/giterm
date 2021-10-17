import { takeEvery, takeLatest, take, put, select } from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'

import { Git, WatcherEvent } from '@giterm/git'
import { CWD_UPDATED } from 'app/store/config/actions'
import { gitRefsChanged, gitHeadChanged } from './actions'
import { CORE_INIT } from 'app/store/core/actions'
import { STATUS_UPDATED } from 'app/store/status/actions'
import { sentrySafeWrapper } from 'app/store/helpers'

function* listenForRefChanges(): any {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const refChangeEmitter = eventChannel((emit) => {
    return git.watcher.watchRefs((data) => {
      emit(data)
    })
  })

  while (true) {
    const { event, ref, isRemote }: WatcherEvent = yield take(refChangeEmitter)

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
    const lastHeadSHA: string = yield select((state) => state.status.headSHA)

    yield take(STATUS_UPDATED)

    const headSHA: string = yield select((state) => state.status.headSHA)
    if (lastHeadSHA !== headSHA) {
      yield put(gitHeadChanged())
    }
  }
}

export function* watch() {
  yield takeLatest(
    [CORE_INIT, CWD_UPDATED],
    sentrySafeWrapper(listenForRefChanges, { restartOnError: true }),
  )
  yield takeEvery(
    [CORE_INIT],
    sentrySafeWrapper(listenForHeadChanges, { restartOnError: true }),
  )
}
