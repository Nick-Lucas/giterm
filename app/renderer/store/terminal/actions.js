export const AUTO_TERMINAL_FULLSCREEN = 'terminal/auto_terminal_fullscreen'
export const autoTerminalFullscreen = (fullscreen) => ({
  type: AUTO_TERMINAL_FULLSCREEN,
  fullscreen,
})

export const FLIP_USER_TERMINAL_FULLSCREEN =
  'terminal/flip_user_terminal_fullscreen'
export const flipUserTerminalFullscreen = () => ({
  type: FLIP_USER_TERMINAL_FULLSCREEN,
})
