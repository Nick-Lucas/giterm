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

describe('terminal store', () => {
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

  describe('fullscreen', () => {
    it('should set user property', () => {
      setupStore()
      state = reducer(state, flipUserTerminalFullscreen())

      expect(state).toEqual(makeState(true, true, false))
    })

    it('should set auto property', () => {
      setupStore()
      state = reducer(state, setAutoTerminalFullscreen(true))
      expect(state).toEqual(makeState(true, false, true))
    })

    it('should override auto property and exit fs on user action', () => {
      setupStore()
      state = reducer(state, setAutoTerminalFullscreen(true))
      state = reducer(state, flipUserTerminalFullscreen())
      expect(state).toEqual(makeState(false, false, false))
    })

    it('should override user property and exit fs on user action', () => {
      setupStore()
      state = reducer(state, setAutoTerminalFullscreen(true))
      state = reducer(state, flipUserTerminalFullscreen())
      expect(state).toEqual(makeState(false, false, false))
    })
  })
})
