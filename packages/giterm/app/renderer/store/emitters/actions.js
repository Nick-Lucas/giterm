export const GIT_REFS_CHANGED = 'git/refs_changed'
export function gitRefsChanged(event, ref, isRemote) {
  return {
    type: GIT_REFS_CHANGED,
    event,
    ref,
    isRemote,
  }
}

export const GIT_HEAD_CHANGED = 'git/head_changed'
export const gitHeadChanged = () => ({
  type: GIT_HEAD_CHANGED,
})
