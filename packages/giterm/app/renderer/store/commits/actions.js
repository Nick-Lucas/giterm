export const COMMITS_UPDATED = 'commits/updated'
export const commitsUpdated = (commits, digest) => ({
  type: COMMITS_UPDATED,
  commits,
  digest,
})

export const REACHED_END_OF_LIST = 'commits/reached_end_of_list'
export const reachedEndOfList = () => ({
  type: REACHED_END_OF_LIST,
})
