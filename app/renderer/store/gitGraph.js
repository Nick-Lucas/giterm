const initialState = []

export const GITGRAPH_UPDATE = 'git-graph/update'

export default (state = initialState, action) => {
  switch (action.type) {
    case GITGRAPH_UPDATE: {
      return action.payload
    }
    default:
      return state
  }
}
