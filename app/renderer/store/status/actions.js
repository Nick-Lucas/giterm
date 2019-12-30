export const STATUS_UPDATED = 'status/updated'

export const statusUpdated = (status, state, headSHA) => ({
  type: STATUS_UPDATED,
  payload: {
    ...status,
    state,
    headSHA,
  },
})
