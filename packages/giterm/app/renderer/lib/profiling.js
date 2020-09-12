export function measure(name, callback) {
  const uuid = 'GITERM/' + name + '/' + performance.now()
  const startMark = uuid + '/start'
  const endMark = uuid + '/end'

  performance.mark(startMark)
  const value = callback()
  if (value.then) {
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
