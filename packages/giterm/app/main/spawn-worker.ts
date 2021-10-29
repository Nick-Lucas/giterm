import { ipcMain, ipcRenderer } from 'electron'
import * as child_process from 'child_process'

import { perfStart } from './performance'

type ChildJob = 'child_process/exec'

// TODO: TS4.5 has this built in and can be removed
type Awaited<T> = T extends PromiseLike<infer U> ? U : T

const createRpc = <
  TFunc extends (...args: any[]) => Promise<any>,
  TReturn = Awaited<ReturnType<TFunc>>,
  TRequest = Parameters<TFunc>,
>(
  eventName: ChildJob,
) => {
  return async (params: TRequest): Promise<TReturn> => {
    const perf = perfStart(eventName)

    try {
      return await ipcRenderer.invoke(eventName, params)
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
  eventName: ChildJob,
  func: TFunc,
) => {
  ipcMain.handle(eventName, async (ev, params: TRequest): Promise<TReturn> => {
    if (Array.isArray(params) && params.length > 0) {
      return func(...params)
    } else {
      return func()
    }
  })

  return {
    dispose: () => ipcMain.removeHandler(eventName),
  }
}

const exec = (command: string): Promise<string> =>
  new Promise((resolve, reject) => {
    child_process.exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve(stdout)
      }
    })
  })

export const SpawnWorker = {
  exec: createRpc<typeof exec>('child_process/exec'),
}

export const startSpawnWorker = () => {
  const handlers = [
    createRpcHandler('child_process/exec', exec),
    //
  ]

  return {
    dispose: () => {
      for (const handler of handlers) {
        handler.dispose()
      }
    },
  }
}
