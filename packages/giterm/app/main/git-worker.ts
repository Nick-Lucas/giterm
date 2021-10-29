import { ipcMain, ipcRenderer } from 'electron'

import { Git } from '@giterm/git'
import { perfStart } from './performance'

type GitJob =
  | 'git/status'
  | 'git/status-text'
  | 'git/head-sha'
  | 'git/remotes'
  | 'git/refs/branches'
  | 'git/refs/tags'
  | 'git/commits/load'
  | 'git/diff/load-file-text'
  | 'git/diff/by-shas'
  | 'git/diff/by-index'

// TODO: TS4.5 has this built in and can be removed
type Awaited<T> = T extends PromiseLike<infer U> ? U : T

const createRpc = <
  TFunc extends (...args: any[]) => Promise<any>,
  TReturn = Awaited<ReturnType<TFunc>>,
  TRequest = Parameters<TFunc>,
>(
  eventName: GitJob,
) => {
  return async (cwd: string, params: TRequest): Promise<TReturn> => {
    const perf = perfStart(eventName)

    try {
      return await ipcRenderer.invoke(eventName, cwd, params)
    } finally {
      perf.done()
    }
  }
}

const createRpcHandler = <
  TFunc extends (...args: any[]) => Promise<any>,
  TReturn = Awaited<ReturnType<TFunc>>,
  TRequest = Parameters<TFunc>,
>(
  eventName: GitJob,
  getFunc: (git: Git) => TFunc,
) => {
  ipcMain.handle(
    eventName,
    async (ev, cwd: string, params: TRequest): Promise<TReturn> => {
      const func = getFunc(new Git(cwd)) as TFunc

      if (Array.isArray(params) && params.length > 0) {
        return func(...params)
      } else {
        return func()
      }
    },
  )

  return {
    dispose: () => ipcMain.removeHandler(eventName),
  }
}

export const GitWorker = {
  getStatus: createRpc<Git['getStatus']>('git/status'),
  getStateText: createRpc<Git['getStateText']>('git/status-text'),
  getHeadSha: createRpc<Git['getHeadSHA']>('git/head-sha'),
  getAllRemotes: createRpc<Git['getAllRemotes']>('git/remotes'),
  commits: {
    load: createRpc<Git['commits']['load']>('git/commits/load'),
  },
  refs: {
    getAllBranches:
      createRpc<Git['refs']['getAllBranches']>('git/refs/branches'),
    getAllTags: createRpc<Git['refs']['getAllTags']>('git/refs/tags'),
  },
  diff: {
    loadFileText: createRpc<Git['diff']['loadFileText']>(
      'git/diff/load-file-text',
    ),
    getByShas: createRpc<Git['diff']['getByShas']>('git/diff/by-shas'),
    getIndex: createRpc<Git['diff']['getIndex']>('git/diff/by-index'),
  },
}

export const startGitWorker = () => {
  const handlers = [
    createRpcHandler('git/status', (git) => git.getStatus),
    createRpcHandler('git/status-text', (git) => git.getStateText),
    createRpcHandler('git/head-sha', (git) => git.getHeadSHA),
    createRpcHandler('git/remotes', (git) => git.getAllRemotes),
    createRpcHandler('git/commits/load', (git) => git.commits.load),
    createRpcHandler('git/refs/branches', (git) => git.refs.getAllBranches),
    createRpcHandler('git/refs/tags', (git) => git.refs.getAllTags),
    createRpcHandler('git/diff/by-index', (git) => git.diff.getIndex),
    createRpcHandler('git/diff/by-shas', (git) => git.diff.getByShas),
    createRpcHandler('git/diff/load-file-text', (git) => git.diff.loadFileText),
  ]

  return {
    dispose: () => {
      for (const handler of handlers) {
        handler.dispose()
      }
    },
  }
}
