export function updateReducer(updateType, initialState) {
  return function(state = initialState, action) {
    switch (action.type) {
      case updateType: {
        /* eslint-disable-next-line no-unused-vars */
        const { type, ...payload } = action

        return Object.keys(payload).length === 1
          ? Object.values(payload)[0]
          : { ...payload }
      }
      default:
        return state
    }
  }
}
