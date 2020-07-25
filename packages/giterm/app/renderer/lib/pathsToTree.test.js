import {
  pathsToTree,
  __splitPathToDepth,
  __root,
  __node,
  __leaf,
} from './pathsToTree'

describe('pathsToTree', () => {
  it('should not split a non-foldered path', () => {
    expect(
      //
      pathsToTree(['hello']),
    ).toEqual(
      //
      __root([__leaf('hello', 'hello')]),
    )
  })

  it('should not split a foldered path', () => {
    expect(
      //
      pathsToTree(['hello/world', 'hello/london', 'goodbye/ny']),
    ).toEqual(
      //
      __root([
        __node('hello', [
          __leaf('world', 'hello/world'),
          __leaf('london', 'hello/london'),
        ]),
        __node('goodbye', [__leaf('ny', 'goodbye/ny')]),
      ]),
    )
  })

  it('should gracefully handle paths ending with folders', () => {
    expect(
      //
      pathsToTree(['hello', 'hello/london']),
    ).toEqual(
      //
      __root([
        __leaf('hello', 'hello'),
        __node('hello', [__leaf('london', 'hello/london')]),
      ]),
    )
  })
})

describe('__splitPathToDepth', () => {
  it('should behave on non-foldered path', () => {
    expect(__splitPathToDepth('hello', 2, '/')).toEqual(['hello'])
  })

  it('should behave on non-foldered path with end folder', () => {
    expect(__splitPathToDepth('hello/', 2, '/')).toEqual(['hello'])
  })

  it('should behave on foldered path', () => {
    expect(__splitPathToDepth('hello/world', 2, '/')).toEqual([
      'hello',
      'world',
    ])
  })

  it('should fold any remaining depth into one', () => {
    expect(__splitPathToDepth('hello/world/hello/london', 2, '/')).toEqual([
      'hello',
      'world',
      'hello/london',
    ])
  })
})
