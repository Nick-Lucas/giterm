import { COMMITS_UPDATED, LOAD_MORE_COMMITS } from './actions'

const initialState = {
  numberToLoad: 500,
  commits: [],
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case COMMITS_UPDATED:
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