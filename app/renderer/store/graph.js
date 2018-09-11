import { updateReducer } from './helpers'
import { GraphCalculator } from './graph/graph-calculator'

// TODO: ewwwww why?
import { RowHeight } from '../components/commits'

export const GRAPH_UPDATE = 'graph/update'
export const GRAPH_UPDATE_SKIPPED = 'graph/update_skipped'

export const doUpdateGraph = () => {
  return async (dispatch, getState) => {
    const {
      commits: { commits = [], digest },
      graph: { holistics = {} },
    } = getState()

    if (digest === holistics.digest) {
      dispatch({ type: GRAPH_UPDATE_SKIPPED })
      return
    }

    const calculator = new GraphCalculator(RowHeight)
    const rows = calculator.retrieve(commits)

    dispatch({
      type: GRAPH_UPDATE,
      payload: {
        holistics: {
          digest,
        },
        rows,
      },
    })
  }
}

const initialState = []
export default updateReducer(GRAPH_UPDATE, initialState)
