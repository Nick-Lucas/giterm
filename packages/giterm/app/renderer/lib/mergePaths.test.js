import { mergePaths } from './mergePaths'

describe('mergePaths', () => {
  it('should not split a non-foldered path', () => {
    expect(mergePaths(['hello'])).toEqual({ hello: {} })
  })

  it('should not split a foldered path', () => {
    expect(mergePaths(['hello/world', 'hello/london', 'goodbye/ny'])).toEqual({
      hello: { world: {}, london: {} },
      goodbye: { ny: {} },
    })
  })

  it('should gracefully handle paths ending with folders', () => {
    expect(mergePaths(['hello', 'hello/london', 'goodbye/ny'])).toEqual({
      hello: { london: {} },
      goodbye: { ny: {} },
    })
  })
})
