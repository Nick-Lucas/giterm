import { COMMITS_UPDATE, LOAD_MORE_COMMITS } from './actions'

const initialState = {
  numberToLoad: 500,
  commits: [],
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case COMMITS_UPDATE:
      return {
        ...state,
        commits: action.commits,
        digest: action.digest,
      }
    case LOAD_MORE_COMMITS:
      return {
        ...state,
        numberToLoad: state.numberToLoad + 500,
      }
    default:
      return state
  }
}
