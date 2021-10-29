const PROFILING = true

const isPerformanceAvailable = typeof performance !== 'undefined'
if (!isPerformanceAvailable) {
  console.warn(
    'Giterm: Performance module is not available. Performance will not be tracked for Git tasks',
  )
}

export let perfStart = (name: string) => {
  performance.mark(name + '/start')

  return { done: () => perfEnd(name) }
}

const perfEnd = (name: string) => {
  performance.mark(name + '/end')
  performance.measure(name, name + '/start', name + '/end')
}

if (
  process.env.NODE_ENV !== 'development' ||
  !PROFILING ||
  !isPerformanceAvailable
) {
  perfStart = () => ({ done: () => {} })
}
