import { DIFF_INDEX, DIFF_SHAS, DIFF_COMPLETE } from './actions'

const initialState = {
  show: false,
  mode: null,
  shas: [],
}

export function reducer(state = initialState, action) {
  switch (action.type) {
    case DIFF_COMPLETE: {
      return initialState
    }

    case DIFF_INDEX: {
      return {
        show: true,
        mode: 'index',
        shas: null,
      }
    }

    case DIFF_SHAS: {
      const { shas } = action

      return {
        show: true,
        mode: 'shas',
        shas: shas,
      }
    }

    default:
      return state
  }
}
