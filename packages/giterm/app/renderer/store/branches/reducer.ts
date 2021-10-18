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

        const upstream = branch.upstream
        if (upstream && upstream.sha) {
          const isRemoteOnly = !branch.local && !!upstream
          const isLocallyTrackedButAheadOrBehind =
            !!branch.local && upstream.sha != branch.sha

          if (isRemoteOnly || isLocallyTrackedButAheadOrBehind) {
            if (!bySha[upstream.sha]) {
              bySha[upstream.sha] = []
            }
            bySha[upstream.sha].push(branch)
          }
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
