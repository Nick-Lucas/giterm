import { ipcMain, ipcRenderer } from 'electron'

import { Git } from '@giterm/git'

type GitJob = 'git/status' | 'git/status-text' | 'git/head-sha'

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
    return await ipcRenderer.invoke(eventName, cwd, params)
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

export const Worker = {
  getStatus: createRpc<Git['getStatus']>('git/status'),
  getStateText: createRpc<Git['getStateText']>('git/status-text'),
  getHeadSha: createRpc<Git['getHeadSHA']>('git/head-sha'),
}

export const startWorker = () => {
  const handlers = [
    createRpcHandler('git/status', (git) => git.getStatus),
    createRpcHandler('git/status-text', (git) => git.getStateText),
    createRpcHandler('git/head-sha', (git) => git.getHeadSHA),
  ]

  return {
    dispose: () => {
      for (const handler of handlers) {
        handler.dispose()
      }
    },
  }
}
