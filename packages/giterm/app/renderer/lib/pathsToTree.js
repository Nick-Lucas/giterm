import _ from 'lodash'

export function __splitPathToDepth(path, maxDepth, delimiter) {
  const splitPath = path.split(delimiter).filter(Boolean)
  const elements = splitPath.splice(0, maxDepth)
  if (splitPath.length > 0) {
    elements.push(splitPath.join(delimiter))
  }
  return elements
}

/**
 * @param {string[]} paths
 * @param {int} depth
 */
export function pathsToTree(
  objects = [],
  pathGetter = (obj) => obj,
  { maxDepth = 2, delimiter = '/' } = {},
) {
  const paths = objects.map((obj) => {
    const names = __splitPathToDepth(pathGetter(obj), maxDepth, delimiter)
    return [names, obj]
  })

  const root = __root()
  for (let y = 0; y < paths.length; y++) {
    const [path, terminatorObject] = paths[y]

    let x = 0
    const xMax = Math.min(maxDepth, path.length - 1)

    let cursor = root
    while (true) {
      const elementsRemaining = xMax - x
      const name = path[x]

      let matchIndex = cursor.children.findIndex(
        (child) => child.name === name && child.node,
      )
      if (matchIndex === -1) {
        cursor.children.push(__node(name))

        matchIndex = cursor.children.length - 1
      }

      if (elementsRemaining === 0) {
        cursor.children[matchIndex] = {
          leaf: true,
          name,
          object: terminatorObject,
        }
        break
      }

      cursor = cursor.children[matchIndex]
      x++
    }
  }

  return root
}

export const __root = (children = []) => ({ root: true, children })
export const __node = (name, children = []) => ({ node: true, name, children })
export const __leaf = (name, object = null) => ({ leaf: true, name, object })
