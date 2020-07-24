/**
 * @param {string[]} paths
 * @param {int} depth
 */
export function mergePaths(flatPaths = [], maxDepth = 2) {
  const paths = flatPaths.map((path) => path.split(/\//))

  const zip = {}
  let cursor = null
  for (let y = 0; y < paths.length; y++) {
    cursor = zip

    const path = paths[y]
    const xMax = Math.min(maxDepth, path.length)
    for (let x = 0; x < xMax; x++) {
      const elementsRemaining = xMax - x - 1
      const pathElement = path[x]

      if (!cursor[pathElement]) {
        cursor[pathElement] = {}
      }

      cursor = cursor[pathElement]
    }
  }

  return zip
}
