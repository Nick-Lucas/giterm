import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import {
  routerMiddleware,
  routerReducer as routing,
  push,
} from 'react-router-redux'
import persistState from 'redux-localstorage'
import thunk from 'redux-thunk'

import gitGraph from './store/gitGraph'

export default function configureStore(initialState, routerHistory) {
  const router = routerMiddleware(routerHistory)

  const actionCreators = {
    push,
  }

  const reducers = {
    gitGraph,
  }

  const middlewares = [thunk, router]

  const composeEnhancers = (() => {
    const compose_ = window && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    if (process.env.NODE_ENV === 'development' && compose_) {
      return compose_({ actionCreators })
    }
    return compose
  })()

  const enhancer = composeEnhancers(
    applyMiddleware(...middlewares),
    persistState(),
  )
  const rootReducer = combineReducers(reducers)

  return createStore(rootReducer, initialState, enhancer)
}
