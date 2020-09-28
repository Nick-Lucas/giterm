export const DIFF_INDEX = 'diff/index'
export const diffIndex = () => ({
  type: DIFF_INDEX,
})

export const DIFF_SHAS = 'diff/shas'
export const diffShas = (shaOld, shaNew) => ({
  type: DIFF_SHAS,
  shas: [shaOld, shaNew],
})

export const DIFF_COMPLETE = 'diff/complete'
export const diffComplete = () => ({
  type: DIFF_COMPLETE,
})
