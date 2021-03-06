import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
import * as Sentry from '@sentry/electron'

// Reducers
import * as reducers from './reducers'
import * as sagas from './sagas'

export default function configureStore(initialState) {
  const rootReducer = combineReducers(reducers)

  // Dev tools integration
  const composeEnhancers = (() => {
    const compose_ = window && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    if (process.env.NODE_ENV === 'development' && compose_) {
      return compose_
    }
    return compose
  })()

  // Side effect middlewares
  const sagaMiddleware = createSagaMiddleware({
    onError: (error, info) => {
      Sentry.captureException(error)
      console.error('Error in saga: ', error, info)
    },
  })

  const sentryMiddleware = () => (next) => (action) => {
    Sentry.addBreadcrumb({
      category: 'redux',
      message: action.type,
    })
    try {
      return next(action)
    } catch (err) {
      console.error(err)
      Sentry.captureException(err)
    }
  }

  // Store composition
  const enhancer = composeEnhancers(
    applyMiddleware(sagaMiddleware, sentryMiddleware),
  )
  const store = createStore(rootReducer, initialState, enhancer)

  for (const saga of Object.values(sagas)) {
    sagaMiddleware.run(saga)
  }

  return store
}
