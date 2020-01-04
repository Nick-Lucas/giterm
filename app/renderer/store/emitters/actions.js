export const GIT_REFS_CHANGED = 'git/refs_changed'
export function gitRefsChanged(ref, isRemote) {
  return {
    type: GIT_REFS_CHANGED,
    ref,
    isRemote,
  }
}
