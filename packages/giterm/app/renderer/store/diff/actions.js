export const DIFF_INDEX = 'diff/index'
export const diffIndex = (filePath = null) => ({
  type: DIFF_INDEX,
  filePath,
})

export const DIFF_SHAS = 'diff/shas'
export const diffShas = (shaNew, shaOld = null, filePath = null) => ({
  type: DIFF_SHAS,
  shas: [shaNew, shaOld],
  filePath,
})

export const DIFF_COMPLETE = 'diff/complete'
export const diffComplete = () => ({
  type: DIFF_COMPLETE,
})

export const DIFF_TOGGLE_SHOW = 'diff/toggle_show'
export const diffToggleShow = () => ({
  type: DIFF_TOGGLE_SHOW,
})

export const DIFF_FILE_SELECTED = 'diff/file_selected'
export const diffFileSelected = (filePath) => ({
  type: DIFF_FILE_SELECTED,
  filePath,
})
