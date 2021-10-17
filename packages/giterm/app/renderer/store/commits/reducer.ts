import { Commit } from '@giterm/git'
import { COMMITS_UPDATED, REACHED_END_OF_LIST } from './actions'

export interface Reducer {
  numberToLoad: number
  digest?: string
  commits: Commit[]
}

const initialState: Reducer = {
  numberToLoad: 100,
  commits: [],
}

export const reducer = (state = initialState, action: any): Reducer => {
  switch (action.type) {
    case COMMITS_UPDATED:
      return {
        ...state,
        commits: action.commits,
        digest: action.digest,
      }
    case REACHED_END_OF_LIST:
      return {
        ...state,
        numberToLoad:
          state.commits.length < state.numberToLoad
            ? state.numberToLoad
            : state.numberToLoad + 100,
      }
    default:
      return state
  }
}
