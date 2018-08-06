export function updateReducer(updateType, initialState) {
  return function(state = initialState, action) {
    switch (action.type) {
      case updateType: {
        return action.payload
      }
      default:
        return state
    }
  }
}
