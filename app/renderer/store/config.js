export const UPDATE_CWD = 'config/update_cwd'
export const updateCwd = (cwd) => ({
  type: UPDATE_CWD,
  payload: cwd,
})

export default (state = {}, action) => {
  switch (action.type) {
    case UPDATE_CWD: {
      return {
        ...state,
        cwd: action.payload,
      }
    }
    default: {
      return state
    }
  }
}
