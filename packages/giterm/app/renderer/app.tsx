import React from 'react'
import ReactDOM from 'react-dom'

import { Provider } from 'react-redux'
import { Switch, Route, Router } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'

import { createMemoryHistory } from 'history'
import configureStore from './store'

import { Home } from './containers/home'
import { showRemoteBranches, showBranchTags } from './store/config/actions'
import { flipUserTerminalFullscreen } from './store/terminal/actions'
import { diffToggleShow, diffToggleDiffMode } from './store/diff/actions'

import '../sentry'
import { ErrorBoundary } from '@sentry/react'

// Store Init
const initialState = {}
const routerHistory = createMemoryHistory()
const store = configureStore(initialState)
const history = syncHistoryWithStore(routerHistory as any, store)

interface Modifiers {
  ctrl: boolean
  alt: boolean
  meta: boolean
  shift: boolean
}
function combo(
  ev: KeyboardEvent,
  pressed = false,
  {
    ctrl = false,
    alt = false,
    meta = false,
    shift = false,
  }: Partial<Modifiers> = {},
) {
  return (
    pressed &&
    ev.ctrlKey == ctrl &&
    ev.altKey == alt &&
    ev.metaKey == meta &&
    ev.shiftKey == shift
  )
}

// Shortcuts
window.addEventListener(
  'keydown',
  (ev) => {
    if (combo(ev, ev.code === 'Tab', { ctrl: true })) {
      store.dispatch(flipUserTerminalFullscreen())
      ev.stopImmediatePropagation()
      return
    }
    if (combo(ev, ev.code === 'Digit1', { ctrl: true })) {
      store.dispatch(diffToggleShow())
      ev.stopImmediatePropagation()
      return
    }
    if (combo(ev, ev.key === 'r', { ctrl: true })) {
      store.dispatch(
        showRemoteBranches(!store.getState().config.showRemoteBranches),
      )
      ev.stopImmediatePropagation()
      return
    }
    if (combo(ev, ev.key === 'i', { ctrl: true })) {
      store.dispatch(diffToggleDiffMode())
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
const rootElementSelector = document.currentScript?.getAttribute(
  'data-container',
) as string
const rootElement = document.querySelector(rootElementSelector)

ReactDOM.render(
  <ErrorBoundary>
    <Provider store={store}>
      <Router history={history as any}>
        <Switch>
          <Route exact path="/" component={Home} />
        </Switch>
      </Router>
    </Provider>
  </ErrorBoundary>,
  rootElement,
)
