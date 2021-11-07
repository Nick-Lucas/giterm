import { StatusFile } from '@giterm/git'

export const STATUS_UPDATED = 'status/updated'
export const statusUpdated = (
  files: StatusFile[],
  state: string,
  headSHA: string,
  headBranch: string,
) => ({
  type: STATUS_UPDATED,
  payload: {
    files,
    state,
    headSHA,
    headBranch,
  },
})
