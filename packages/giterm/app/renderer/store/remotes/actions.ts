import { Remote } from '@giterm/git'

export const REMOTES_UPDATED = 'remotes/updated'

export const remotesUpdated = (remotes: Remote[]) => ({
  type: REMOTES_UPDATED,
  remotes,
})
