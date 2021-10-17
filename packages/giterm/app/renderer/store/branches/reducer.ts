import { BRANCHES_UPDATED } from './actions'
import _ from 'lodash'

import { BranchRefs, BranchRef, GetBranchRefs } from '@giterm/git'

export interface BranchesReducer {
  query: GetBranchRefs | null
  list: BranchRef[]
  bySha: Record<string, BranchRef[]>
}

const initialState: BranchesReducer = {
  query: null,
  list: [],
  bySha: {},
}

export function reducer(state = initialState, action: any): BranchesReducer {
  switch (action.type) {
    case BRANCHES_UPDATED: {
      const branches = action.branches as BranchRefs

      const bySha: BranchesReducer['bySha'] = {}
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
