import { TAGS_UPDATED } from './actions'
import _ from 'lodash'

import { TagRefs, TagRef, GetTagRefs } from '@giterm/git'

export interface TagsReducer {
  query?: GetTagRefs
  list: TagRef[]
  bySha: Record<string, TagRef[]>
}

const initialState: TagsReducer = {
  list: [],
  bySha: {},
}

export function reducer(state = initialState, action: any): TagsReducer {
  switch (action.type) {
    case TAGS_UPDATED: {
      const tags = action.tags as TagRefs

      return {
        query: tags.query,
        list: tags.refs,
        bySha: _.groupBy(tags.refs, (tag) => tag.sha),
      }
    }

    default:
      return state
  }
}
