import React from 'react'
import ReactDOM from 'react-dom/profiling'

import { Provider } from 'react-redux'
import { Switch, Route, Router } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'

import { createMemoryHistory } from 'history'
import configureStore from './store'

import { Home } from './containers/home'
import { showRemoteBranches, showBranchTags } from './store/config/actions'
import { flipUserTerminalFullscreen } from './store/terminal/actions'

import '../sentry'
import { ErrorBoundary } from '@sentry/react'

// Store Init
const initialState = {}
const routerHistory = createMemoryHistory()
const store = configureStore(initialState)
const history = syncHistoryWithStore(routerHistory, store)

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
    if (ev.key === 'Alt') {
      store.dispatch(showBranchTags(false))
    }
  },
  { capture: true, once: false, passive: true },
)
window.addEventListener(
  'keyup',
  (ev) => {
    if (ev.key === 'Alt') {
      store.dispatch(showBranchTags(true))
    }
  },
  { capture: true, once: false, passive: true },
)

// DOM Init
const rootElement = document.querySelector(
  document.currentScript.getAttribute('data-container'),
)
ReactDOM.render(
  <ErrorBoundary fallback="An error occurred and has been reported. Please restart the app">
    <Provider store={store}>
      <Router history={history}>
        <Switch>
          <Route exact path="/" component={Home} />
        </Switch>
      </Router>
    </Provider>
  </ErrorBoundary>,
  rootElement,
)
