import { TAGS_UPDATED } from './actions'
import _ from 'lodash'

const initialState = {
  list: [],
  bySha: {},
}

export function reducer(state = initialState, action) {
  switch (action.type) {
    case TAGS_UPDATED: {
      const { tags } = action

      return {
        list: tags,
        bySha: _.groupBy(tags, (branch) => branch.headSHA),
      }
    }

    default:
      return state
  }
}
