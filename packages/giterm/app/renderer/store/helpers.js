import { call } from 'redux-saga/effects'
import * as Sentry from '@sentry/electron'

export function updateReducer(updateType, initialState) {
  return function(state = initialState, action) {
    switch (action.type) {
      case updateType: {
        const { type, ...payload } = action

        return Object.keys(payload).length === 1
          ? Object.values(payload)[0]
          : { ...payload }
      }

      default:
        return state
    }
  }
}

export function sentrySafeWrapper(effect, { restartOnError = false } = {}) {
  return function* self(...args) {
    try {
      yield call(effect, ...args)
    } catch (e) {
      Sentry.captureException(e)
      console.warn('Error caught', e)

      if (restartOnError) {
        yield call(self, ...args)
      }
    }
  }
}
