import {
  DIFF_INDEX,
  DIFF_SHAS,
  DIFF_COMPLETE,
  DIFF_TOGGLE_SHOW,
  DIFF_FILE_SELECTED,
  DIFF_TOGGLE_DIFF_MODE,
} from './actions'
import produce from 'immer'

export interface DiffState {
  show: boolean
  mode: 'shas' | 'index' | null
  shas: string[]
  filePath: string | null
  diffMode: 'split' | 'inline'
}

const initialState: DiffState = {
  show: false,
  mode: null,
  shas: [],
  filePath: null,
  diffMode: 'split',
}

export function reducer(state = initialState, action: any): DiffState {
  return produce(state, (draft) => {
    switch (action.type) {
      case DIFF_COMPLETE: {
        return initialState
      }

      case DIFF_INDEX: {
        return {
          ...draft,
          show: true,
          mode: 'index',
          shas: [],
          filePath: action.filePath,
        }
      }

      case DIFF_SHAS: {
        const { shas } = action

        return {
          ...draft,
          show: true,
          mode: 'shas',
          shas: shas,
          filePath: action.filePath,
        }
      }

      case DIFF_TOGGLE_SHOW: {
        draft.show = !draft.show
        return
      }

      case DIFF_TOGGLE_DIFF_MODE: {
        draft.diffMode = draft.diffMode === 'inline' ? 'split' : 'inline'
        return
      }

      case DIFF_FILE_SELECTED: {
        draft.filePath = action.filePath
        return
      }
    }
  })
}
