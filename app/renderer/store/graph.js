import { updateReducer } from './helpers'
import { GraphCalculator } from './graph/graph-calculator'

// TODO: ewwwww why?
import { RowHeight } from '../components/commits'

export const GRAPH_UPDATE = 'graph/update'

export const doUpdateGraph = () => {
  return async (dispatch, getState) => {
    const { commits } = getState().commits

    const calculator = new GraphCalculator(RowHeight)
    const rows = calculator.retrieve(commits)

    dispatch({
      type: GRAPH_UPDATE,
      payload: rows,
    })
  }
}

const initialState = []
export default updateReducer(GRAPH_UPDATE, initialState)
