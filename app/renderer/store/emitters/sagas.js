import { takeLatest, take, put, select } from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'

import { Git } from '../../lib/git'
import { CWD_UPDATED } from '../config/actions'
import { gitRefsChanged } from './actions'
import { CORE_INIT } from '../core/actions'

function* listenForRefChanges() {
  const cwd = yield select((state) => state.config.cwd)
  const git = new Git(cwd)

  const refChangeEmitter = eventChannel((emit) => {
    return git.watchRefs((data) => {
      emit(data)
    })
  })

  while (true) {
    const { event, ref, isRemote } = take(refChangeEmitter)

    const { showRemoteBranches } = yield select((state) => state.config)
    if (isRemote && !showRemoteBranches) {
      // Hasn't actually changed visibly
      continue
    }

    yield put(gitRefsChanged(event, ref, isRemote))
  }
}

export function* watch() {
  yield takeLatest([CORE_INIT, CWD_UPDATED], listenForRefChanges)
}
