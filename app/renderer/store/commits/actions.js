export const COMMITS_UPDATED = 'commits/updated'
export const commitsUpdated = (commits, digest) => ({
  type: COMMITS_UPDATED,
  commits,
  digest,
})

export const LOAD_MORE_COMMITS = 'commits/load_more'
export const loadMore = () => ({
  type: LOAD_MORE_COMMITS,
})

export const CHECKOUT_COMMIT = 'commits/checkout'
export const checkoutCommit = (sha) => ({
  type: CHECKOUT_COMMIT,
  sha,
})
