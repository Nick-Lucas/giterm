import React from 'react'
import ReactDOM from 'react-dom'

import { Provider } from 'react-redux'
import { Switch, Route, Router } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'

import { createMemoryHistory } from 'history'
import configureStore from './store'

import Home from './containers/home'
import { updateCwd, showRemoteBranches } from './store/config/actions'
import { flipUserTerminalFullscreen } from './store/terminal/actions'
import { remote } from 'electron'

// Store Init
const initialState = {}
const routerHistory = createMemoryHistory()
const store = configureStore(initialState)
const history = syncHistoryWithStore(routerHistory, store)

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
        showRemoteBranches(!store.getState().config.showRemoteBranches),
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
    <Router history={history}>
      <Switch>
        <Route exact path="/" component={Home} />
      </Switch>
    </Router>
  </Provider>,
  rootElement,
)
