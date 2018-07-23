import React from 'react'
import ReactDOM from 'react-dom'

import { Provider } from 'react-redux'
import { Switch, Route } from 'react-router'
import { ConnectedRouter } from 'react-router-redux'

import { createMemoryHistory } from 'history'
import configureStore from './store'

import Home from './containers/home'

const syncHistoryWithStore = (store, history) => {
  const { routing } = store.getState()
  if (routing && routing.location) {
    history.replace(routing.location)
  }
}

const initialState = {}
const routerHistory = createMemoryHistory()
const store = configureStore(initialState, routerHistory)
syncHistoryWithStore(store, routerHistory)

const rootElement = document.querySelector(
  document.currentScript.getAttribute('data-container'),
)

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={routerHistory}>
      <Switch>
        <Route exact path="/" component={Home} />
      </Switch>
    </ConnectedRouter>
  </Provider>,
  rootElement,
)
