import React from 'react'
import ReactDOM from 'react-dom'

import { Provider } from 'react-redux'
import { Switch, Route } from 'react-router'
import { ConnectedRouter } from 'react-router-redux'

import { createMemoryHistory } from 'history'
import configureStore from './store'

import Home from './containers/home'
import { updateCwd, updateShowRemoteBranches } from './store/config'
import { flipUserTerminalFullscreen } from './store/terminal'
import { remote } from 'electron'

const syncHistoryWithStore = (store, history) => {
  const { routing } = store.getState()
  if (routing && routing.location) {
    history.replace(routing.location)
  }
}

// Store Init
const initialState = {}
const routerHistory = createMemoryHistory()
const store = configureStore(initialState, routerHistory)
syncHistoryWithStore(store, routerHistory)
const cwd = process.cwd()
store.dispatch(updateCwd(cwd === '/' ? remote.app.getPath('home') : cwd))

// Shortcuts
window.addEventListener(
  'keydown',
  (ev) => {
    if (ev.ctrlKey && ev.code === 'Tab') {
      store.dispatch(flipUserTerminalFullscreen())
      ev.stopImmediatePropagation()
      return
    }
    if (ev.ctrlKey && ev.key === 'r') {
      store.dispatch(
        updateShowRemoteBranches(!store.getState().config.showRemoteBranches),
      )
      ev.stopImmediatePropagation()
      return
    }
  },
  true,
)

// DOM Init
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
