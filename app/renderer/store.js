import { createStore, applyMiddleware, combineReducers, compose } from 'redux'

// import persistState from 'redux-localstorage'
import thunk from 'redux-thunk'
import { Git } from './lib/git'

// Reducers
import commits from './store/commits'
import graph from './store/graph'
import status from './store/status'
import branches from './store/branches'
import config from './store/config'
import terminal from './store/terminal'
import { routerReducer } from 'react-router-redux'

export default function configureStore(initialState) {
  const reducers = {
    config,
    commits,
    graph,
    status,
    branches,
    terminal,
    routing: routerReducer,
  }

  const rootReducer = combineReducers(reducers)

  // Dev tools integration
  const composeEnhancers = (() => {
    const compose_ = window && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    if (process.env.NODE_ENV === 'development' && compose_) {
      return compose_
    }
    return compose
  })()

  // Thunks middleware
  const git = new Git()
  const thunkMiddleware = thunk.withExtraArgument({
    git,
  })

  // Middleware composition
  const enhancer = composeEnhancers(
    applyMiddleware(git.reduxMiddleware, thunkMiddleware),
    // persistState(),
  )

  return createStore(rootReducer, initialState, enhancer)
}
