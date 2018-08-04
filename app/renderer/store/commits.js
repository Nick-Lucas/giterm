const initialState = []

export const COMMITS_UPDATE = 'commits/update'

export default (state = initialState, action) => {
  switch (action.type) {
    case COMMITS_UPDATE: {
      return action.payload
    }
    default:
      return state
  }
}
