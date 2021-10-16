const PROFILING = true

export let perfStart = (name: string) => {
  performance.mark(name + '/start')
}

export let perfEnd = (name: string) => {
  performance.mark(name + '/end')
  performance.measure(name, name + '/start', name + '/end')
}

const perfTrace = <R, A extends any[], F extends (...args: A) => Promise<R>>(
  name: string,
  func: F,
): F => {
  return async function (...args: A): Promise<R> {
    perfStart(name)
    const result = await func(...args)
    perfEnd(name)
    return result
  } as F
}

if (process.env.NODE_ENV !== 'development' || !PROFILING) {
  perfStart = function () {}
  perfEnd = function () {}
}

export function instrumentClass(
  instance: any,
  onInstrument?: (methodName: string) => boolean,
) {
  instance = instance as Record<string, any>
  for (const key in Object.getOwnPropertyDescriptors(instance)) {
    if (
      typeof instance[key] !== 'function' || // Only care about functions
      key.startsWith('_') // Don't care about internals
    ) {
      continue
    }

    const willInstrument = !onInstrument || onInstrument(key)
    if (!willInstrument) {
      continue
    }

    instance[key] = perfTrace(`GIT/${key}`, instance[key])
  }
}
