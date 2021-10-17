import { call } from 'redux-saga/effects'
import * as Sentry from '@sentry/electron'

export function updateReducer<T>(updateType: string, initialState: T) {
  return function (state = initialState, action: any): T {
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

export function sentrySafeWrapper(
  effect: (...args: []) => any,
  { restartOnError = false } = {},
) {
  return function* self(...args: any[]): ReturnType<typeof effect> {
    try {
      yield call(effect as any, ...args)
    } catch (e) {
      Sentry.captureException(e)
      console.warn('Error caught', e)

      if (restartOnError) {
        yield call(self, ...args)
      }
    }
  }
}
