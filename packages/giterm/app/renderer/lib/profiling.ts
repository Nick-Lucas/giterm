export function measure<T>(name: string, callback: () => T): T

export function measure<T>(name: string, callback: () => Promise<T>): Promise<T>

export function measure<T>(name: string, callback: () => Promise<T> | T): any {
  const uuid = 'GITERM/' + name + '/' + performance.now()
  const startMark = uuid + '/start'
  const endMark = uuid + '/end'

  performance.mark(startMark)
  const value = callback()
  if ('then' in value) {
    return value.then((result) => {
      performance.mark(endMark)
      performance.measure(uuid, startMark, endMark)
      return result
    })
  } else {
    performance.mark(endMark)
    performance.measure(uuid, startMark, endMark)
    return value
  }
}
