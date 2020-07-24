export const STATUS_UPDATED = 'status/updated'
export const statusUpdated = (files, state, headSHA) => ({
  type: STATUS_UPDATED,
  payload: {
    files,
    state,
    headSHA,
  },
})
