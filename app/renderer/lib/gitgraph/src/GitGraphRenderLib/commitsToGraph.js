import _ from 'lodash'

/** Commit
  {
    sha: '7eef151bf46f22ce1908cbe14861747d32e2d3a1',
    sha7: '7eef15',
    parents: [
      '5dca9d5c8daac7f1f400802689d35a1cd888e0a8'
    ],

    isHead: false,
    message: '',
    detail: '',
    date: '2019-09-02T15:06:26.000Z',
    dateStr: '2019/09/02 16:06',
    time: 1567436786,
    committer: {},
    email: '',
    author: '',
    authorStr: ''
  },
 */

function cloneNodeAsBlank(node, parentSha) {
  return {
    ...node,
    type: 'blank',
    parents: [parentSha],
  }
}

function commitToNode(commit, primaryColour, secondaryColour = null) {
  return {
    type: 'node',
    sha: commit.sha,
    parents: commit.parents,
    deleted: false,
    orphan: commit.parents.length === 0,
    primaryColour,
    secondaryColour,
  }
}

export function _link(
  y1,
  x1,
  y2,
  x2,
  colour,
  { nodeAtStart = true, nodeAtEnd = true } = {},
) {
  return {
    x1: x1,
    y1,
    x2: x2,
    y2,
    colour,
    nodeAtStart,
    nodeAtEnd,
  }
}

class ColourTracker {
  constructor() {
    this._colourIndex = -1
  }

  next = () => ++this._colourIndex
}

function rehydrate({ nodes = [], links = [], colours = {} }) {
  return {
    nodes,
    links,
    colours: Object.assign(new ColourTracker(), colours),
  }
}

export function commitsToGraph(commits = [], rehydrationPackage = {}) {
  const { nodes, links, colours } = rehydrate(rehydrationPackage)

  function prepareNext() {
    const last = nodes[nodes.length - 1] || []
    const lastLinks = links[links.length - 1] || []
    const next = []
    const rowLinks = []

    const rowIndex = nodes.push(next) - 1
    links.push(rowLinks)

    for (const nodeIndexStr in last) {
      const nodeIndex = parseInt(nodeIndexStr)
      const node = last[nodeIndex]
      if (node.deleted || node.orphan) {
        // TODO: does deleted need any special logic?

        // No longer needs tracking
        continue
      }

      for (const parentIndexStr in node.parents) {
        const parentIndex = parseInt(parentIndexStr)
        const parentSha = node.parents[parentIndex]
        const columnIndex = next.push(cloneNodeAsBlank(node, parentSha)) - 1

        let colour = node.primaryColour
        if (node.type === 'node') {
          if (parentIndex == 0) {
            colour = node.primaryColour
          } else {
            colour = colours.next()
            node.secondaryColour = colour
          }
        } else {
          colour = lastLinks[nodeIndex].colour
        }

        rowLinks.push(
          _link(rowIndex - 1, nodeIndex, rowIndex, columnIndex, colour, {
            nodeAtStart: node.type === 'node',
            nodeAtEnd: false,
          }),
        )
      }
    }

    return { last, next, rowIndex, rowLinks }
  }

  for (const commit of commits) {
    const { next, rowIndex, rowLinks } = prepareNext()

    function trackNewBranch() {
      const colour = colours.next()
      next.push(commitToNode(commit, colour))
    }

    function trackKnownParent(column) {
      next[column] = commitToNode(commit, rowLinks[column].colour)

      rowLinks[column].nodeAtEnd = true
    }

    const matches = []
    for (const columnIndexStr in next) {
      const columnIndex = parseInt(columnIndexStr)
      const node = next[columnIndex]
      if (node.parents[0] === commit.sha) {
        matches.push([columnIndex, node])
      }
    }

    if (matches.length === 0) {
      trackNewBranch()
    } else {
      let nodeColumn = null
      for (const matchIndex in matches) {
        const firstMatch = matchIndex == 0
        const [columnIndex, node] = matches[matchIndex]

        if (firstMatch) {
          trackKnownParent(columnIndex)
          nodeColumn = columnIndex
        } else {
          rowLinks[columnIndex].nodeAtEnd = true
          rowLinks[columnIndex].x2 = nodeColumn
          node.deleted = true
        }
      }
    }
  }

  // Ensure that even branches we haven't found yet are visible
  const parentShas = children.remainingParentsToFind()
  for (const parentSha of parentShas) {
    const registeredChildren = children.lookup(parentSha)
    for (const coords of registeredChildren) {
      // TODO: do this more efficiently
      const column = nodes
        .slice(coords.row)
        .reduce(
          (cols, nodesRow) => (nodesRow.length > cols ? nodesRow.length : cols),
          0,
        )

      const colour = colours.next()
      nodes[coords.row][coords.column].secondaryColour = colour
      writeLinks(coords.row, coords.column, nodes.length - 1, column, colour, {
        endWithNode: false,
      })
    }
  }

  // TODO: optimise this by making each links row a Set with
  //        understanding of its data, to avoid a second iteration over the whole lot
  for (const i in links) {
    links[i] = _.uniqWith(links[i], _.isEqual)
  }

  return {
    nodes,
    links,
    commits,
    rehydrationPackage: {
      nodes: [...nodes],
      links: [...links],
      colours,
    },
  }
}
