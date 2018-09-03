import { updateReducer } from './helpers'
import { GraphCalculator } from './graph/graph-calculator'

// TODO: ewwwww why?
import { RowHeight } from '../components/commits'

export const GRAPH_UPDATE = 'graph/update'
export const GRAPH_UPDATE_SKIPPED = 'graph/update_skipped'

export const doUpdateGraph = () => {
  return async (dispatch, getState) => {
    const {
      commits: { commits = [] },
      graph: { holistics = {} },
    } = getState()

    if (skipUpdate(commits, holistics)) {
      dispatch({ type: GRAPH_UPDATE_SKIPPED })
      return
    }

    const calculator = new GraphCalculator(RowHeight)
    const rows = calculator.retrieve(commits)

    dispatch({
      type: GRAPH_UPDATE,
      payload: {
        holistics: {
          count: commits.length,
          latestSHA: commits[0].sha,
        },
        rows,
      },
    })
  }
}

// This is an important optimisation since we don't want to end up
//  regenerating the graph for every single commits refresh.
// We only want to do it if we load more commits or some commit changes,
//  so we check the commits list length in case more are loaded.
// Also according to https://gist.github.com/masak/2415865 the SHA is made up
//  of the parent and commit data, which means any change in the history will
//  rewrite the latest commit SHA
const skipUpdate = (commits, holistics) =>
  commits.length === holistics.count && commits[0].sha === holistics.latestSHA

const initialState = []
export default updateReducer(GRAPH_UPDATE, initialState)
