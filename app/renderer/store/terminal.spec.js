import { expect } from 'chai'

import reducer, {
  flipUserTerminalFullscreen,
  setAutoTerminalFullscreen,
} from './terminal'

const makeState = (
  fullscreen = false,
  userTerminalFullscreen = false,
  autoTerminalFullscreen = false,
) => ({
  fullscreen,
  userTerminalFullscreen,
  autoTerminalFullscreen,
})

context('terminal store', () => {
  let state
  const setupStore = (
    fullscreen = false,
    userTerminalFullscreen = false,
    autoTerminalFullscreen = false,
  ) => {
    state = makeState(
      fullscreen,
      userTerminalFullscreen,
      autoTerminalFullscreen,
    )
  }

  context('fullscreen', () => {
    it('should set user property', () => {
      setupStore()
      state = reducer(state, flipUserTerminalFullscreen())

      expect(state).to.deep.equal(makeState(true, true, false))
    })

    it('should set auto property', () => {
      setupStore()
      state = reducer(state, setAutoTerminalFullscreen(true))
      expect(state).to.deep.equal(makeState(true, false, true))
    })

    it('should override auto property and exit fs on user action', () => {
      setupStore()
      state = reducer(state, setAutoTerminalFullscreen(true))
      state = reducer(state, flipUserTerminalFullscreen())
      expect(state).to.deep.equal(makeState(false, false, false))
    })

    it('should override user property and exit fs on user action', () => {
      setupStore()
      state = reducer(state, setAutoTerminalFullscreen(true))
      state = reducer(state, flipUserTerminalFullscreen())
      expect(state).to.deep.equal(makeState(false, false, false))
    })
  })
})
