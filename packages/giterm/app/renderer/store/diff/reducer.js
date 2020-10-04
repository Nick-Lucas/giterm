import {
  DIFF_INDEX,
  DIFF_SHAS,
  DIFF_COMPLETE,
  DIFF_TOGGLE_SHOW,
} from './actions'

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

    case DIFF_TOGGLE_SHOW: {
      return {
        ...state,
        show: !state.show,
      }
    }

    default:
      return state
  }
}
