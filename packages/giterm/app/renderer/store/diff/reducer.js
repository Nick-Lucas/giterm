import {
  DIFF_INDEX,
  DIFF_SHAS,
  DIFF_COMPLETE,
  DIFF_TOGGLE_SHOW,
  DIFF_FILE_SELECTED,
} from './actions'

const initialState = {
  show: false,
  mode: null,
  shas: [],
  filePath: null,
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
        filePath: action.filePath,
      }
    }

    case DIFF_SHAS: {
      const { shas } = action

      return {
        show: true,
        mode: 'shas',
        shas: shas,
        filePath: action.filePath,
      }
    }

    case DIFF_TOGGLE_SHOW: {
      return {
        ...state,
        show: !state.show,
      }
    }

    case DIFF_FILE_SELECTED: {
      return {
        ...state,
        filePath: action.filePath,
      }
    }

    default:
      return state
  }
}
