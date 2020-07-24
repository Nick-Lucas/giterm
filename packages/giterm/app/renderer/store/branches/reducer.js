import { BRANCHES_UPDATED } from './actions'

const initialState = {
  list: [],
  bySha: {},
}

export function reducer(state = initialState, action) {
  switch (action.type) {
    case BRANCHES_UPDATED: {
      const { branches } = action

      return {
        list: branches,
        bySha: {},
      }
    }

    default:
      return state
  }
}
