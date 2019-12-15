import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
// import persistState from 'redux-localstorage'

import { Git } from './lib/git'

// Reducers
import * as reducers from './store/reducers'
import * as sagas from './store/sagas'

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

  // Services
  const git = new Git()

  // Side effect middlewares
  const sagaMiddleware = createSagaMiddleware({
    context: {
      git,
    },
  })

  // Store composition
  const enhancer = composeEnhancers(
    applyMiddleware(git.reduxMiddleware, sagaMiddleware),
    // persistState(),
  )
  const store = createStore(rootReducer, initialState, enhancer)

  for (const saga of Object.values(sagas)) {
    sagaMiddleware.run(saga)
  }

  return store
}
