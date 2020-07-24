import { BRANCHES_UPDATED } from './actions'
import _ from 'lodash'

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
        bySha: _.groupBy(branches, (branch) => branch.headSHA),
      }
    }

    default:
      return state
  }
}
