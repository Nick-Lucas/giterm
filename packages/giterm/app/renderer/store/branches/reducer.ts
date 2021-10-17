import { BRANCHES_UPDATED } from './actions'
import _ from 'lodash'

import { BranchRefs, BranchRef, GetBranchRefs } from '@giterm/git'

export interface Reducer {
  query: GetBranchRefs | null
  list: BranchRef[]
  bySha: Record<string, BranchRef[]>
}

const initialState: Reducer = {
  query: null,
  list: [],
  bySha: {},
}

export function reducer(state = initialState, action: any): Reducer {
  switch (action.type) {
    case BRANCHES_UPDATED: {
      const branches = action.branches as BranchRefs

      const bySha: Reducer['bySha'] = {}
      for (const branch of branches.refs) {
        if (branch.local) {
          if (!bySha[branch.sha]) {
            bySha[branch.sha] = []
          }
          bySha[branch.sha].push(branch)
        }

        if (branch.upstream?.sha && branch.upstream.sha != branch.sha) {
          if (!bySha[branch.upstream.sha]) {
            bySha[branch.upstream.sha] = []
          }
          bySha[branch.upstream.sha].push(branch)
        }
      }

      return {
        query: branches.query,
        list: branches.refs,
        bySha: bySha,
      }
    }

    default:
      return state
  }
}
