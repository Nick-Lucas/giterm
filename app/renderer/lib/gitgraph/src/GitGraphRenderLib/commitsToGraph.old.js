import _ from 'lodash'

function cloneNodeAsBlank(node) {
  return {
    ...node,
    type: 'blank',
  }
}

function commitToNode(commit, primaryColour, secondaryColour = null) {
  return {
    type: 'node',
    sha: commit.sha,
    deleted: false,
    orphan: commit.parents.length === 0,
    primaryColour,
    secondaryColour,
    purgeOnRehydration: commit.purgeOnRehydration,
  }
}

export function _link(
  y1,
  x1,
  y2,
  x2,
  colour,
  { nodeAtStart = true, nodeAtEnd = true, purgeOnRehydration = false } = {},
) {
  return {
    x1,
    y1,
    x2,
    y2,
    colour,
    nodeAtStart,
    nodeAtEnd,
    purgeOnRehydration,
  }
}

// Keep a track of where children are by their parent shas
class ChildDirectory {
  constructor() {
    // object for parents to look up if any children are searching for them
    this._lookup = {}

    // object of all children and their parents still being searched for
    this._tracked = {}

    // Track the number of parents for any commit ever found
    this._parentCount = {}
  }

  register = (sha, parentShas, row, column) => {
    this._tracked[sha] = [...parentShas]
    this._parentCount[sha] = parentShas.length

    for (let parentIndex = 0; parentIndex < parentShas.length; parentIndex++) {
      const parentSha = parentShas[parentIndex]
      if (!this._lookup[parentSha]) {
        this._lookup[parentSha] = []
      }

      this._lookup[parentSha].push({ row, column, parentIndex, sha })
    }
  }

  lookup = (parentSha) => {
    return _.sortBy(this._lookup[parentSha] || [], (child) => [
      child.parentIndex,
      child.column,
    ])
  }

  numberOfParentsFor = (childSha) => {
    return this._parentCount[childSha] || 0
  }

  spliceColumn = (column) => {
    for (const sha in this._lookup) {
      for (const item of this._lookup[sha]) {
        if (item.column > column) {
          item.column -= 1
        }
      }
    }
  }

  insertColumn = (column, fromRow) => {
    for (const sha in this._lookup) {
      for (const item of this._lookup[sha]) {
        if (item.column >= column && item.row >= fromRow) {
          item.column += 1
        }
      }
    }
  }

  cleanup = (parentSha) => {
    delete this._lookup[parentSha]

    for (const sha in this._tracked) {
      const parentIndex = this._tracked[sha].indexOf(parentSha)
      if (parentIndex >= 0) {
        this._tracked[sha].splice(parentIndex, 1)
        if (this._tracked[sha].length === 0) {
          delete this._tracked[sha]
        }
      }
    }
  }

  remainingParentsToFind = () => {
    return _.uniq(_.flatMap(Object.values(this._tracked)))
  }
}

class ColourTracker {
  constructor() {
    this._colourIndex = -1
  }

  next = () => ++this._colourIndex
}

function rehydrate({ nodes = [], links = [], children = {}, colours = {} }) {
  return {
    nodes: nodes.map((nodesRow) =>
      nodesRow.filter((node) => !node.purgeOnRehydration),
    ),
    links: links.map((linksRow) =>
      linksRow.filter((link) => !link.purgeOnRehydration),
    ),
    children: Object.assign(new ChildDirectory(), children),
    colours: Object.assign(new ColourTracker(), colours),
  }
}

export function commitsToGraph(commits = [], rehydrationPackage = {}) {
  const { nodes, links, children, colours } = rehydrate(rehydrationPackage)

  function prepareNext() {
    const last = nodes[nodes.length - 1] || []
    const next = last.map(cloneNodeAsBlank)
    nodes.push(next)

    // generate initial links
    const rowNumber = nodes.length - 1
    const rowLinks = last.map((node, i) =>
      _link(rowNumber - 1, i, rowNumber, i, node.primaryColour, {
        nodeAtStart: node.type === 'node',
        nodeAtEnd: false,
      }),
    )
    links.push(rowLinks)

    // Remove deleted nodes which no longer need tracking and update columns
    for (let i = next.length - 1; i >= 0; i--) {
      const { deleted, orphan } = next[i]

      if (deleted || orphan) {
        next.splice(i, 1)

        rowLinks.splice(i, 1)
        for (let rl = i; rl < rowLinks.length; rl++) {
          if (rowLinks[rl].x2 > i) rowLinks[rl].x2 -= 1
        }

        children.spliceColumn(i)
      }
    }

    return { last, next, rowNumber, rowLinks }
  }

  // A merge or branch point might be more than 1 commit away,
  //  so we have to write links from the merge to the current row
  function writeLinks(
    fromY,
    fromX,
    toY,
    toX,
    colour,
    { endWithNode = true, purgeOnRehydration = false } = {},
  ) {
    const nodeAtEnd = fromY + 1 >= toY

    links[fromY + 1].push(
      _link(fromY, fromX, fromY + 1, toX, colour, {
        nodeAtStart: true,
        nodeAtEnd: nodeAtEnd && endWithNode,
        purgeOnRehydration,
      }),
    )

    for (let row = fromY + 1; row < toY; row++) {
      const nodeAtEnd = row + 1 >= toY
      links[row + 1].push(
        _link(row, toX, row + 1, toX, colour, {
          nodeAtStart: false,
          nodeAtEnd: nodeAtEnd && endWithNode,
          purgeOnRehydration,
        }),
      )
    }
  }

  for (const commit of commits) {
    const { next, rowNumber, rowLinks } = prepareNext()

    function trackNewBranch(childRow = null, childColumn = null) {
      const colour = colours.next()
      const column = next.push(commitToNode(commit, colour)) - 1
      children.register(commit.sha, commit.parents, rowNumber, column)

      if (childRow != null && childColumn != null) {
        nodes[childRow][childColumn].secondaryColour = colour
        writeLinks(childRow, childColumn, rowNumber, column, colour)
      }
    }

    function trackKnownParent(column) {
      next[column] = commitToNode(commit, next[column].primaryColour)
      children.register(commit.sha, commit.parents, rowNumber, column)
      rowLinks[column].nodeAtEnd = true
    }

    function trackOtherChildLinks(
      childSha,
      childColumn,
      childRow,
      destinationColumn,
      colour,
    ) {
      if (childColumn >= next.length) {
        throw new Error('Invariant: column < next.length evaluated to false')
      }

      const childHasAnotherParent = children.numberOfParentsFor(childSha) > 1
      if (childHasAnotherParent) {
        writeLinks(childRow, childColumn, rowNumber, destinationColumn, colour)
      } else {
        next[childColumn].deleted = true
        rowLinks[childColumn].x2 = destinationColumn
        rowLinks[childColumn].nodeAtEnd = true
      }
    }

    const registeredChildren = children.lookup(commit.sha)
    if (registeredChildren.length === 0) {
      trackNewBranch()
    } else {
      // Track which column this commit ends up in, as it may be needed later
      let nodeColumn = null

      for (let i = 0; i < registeredChildren.length; i++) {
        const coords = registeredChildren[i]

        if (i === 0 && coords.parentIndex === 0) {
          // Found direct parent of existing child
          nodeColumn = coords.column
          trackKnownParent(coords.column)
        } else if (i === 0 && coords.parentIndex !== 0) {
          // Found merged-in parent
          nodeColumn = coords.column
          trackNewBranch(coords.row, coords.column)
        } else {
          // Found child branched off from parent
          if (nodeColumn == null) {
            throw "Invariant: nodeColumn was null, ensure it's always populated first"
          }

          const childNode = nodes[coords.row][coords.column]
          const colour =
            coords.parentIndex === 0
              ? childNode.primaryColour
              : next[nodeColumn].primaryColour
          if (childNode.primaryColour !== colour) {
            childNode.secondaryColour = colour
          }

          trackOtherChildLinks(
            coords.sha,
            coords.column,
            coords.row,
            nodeColumn,
            colour,
          )
        }
      }
    }

    // Keep the child directory minimal
    children.cleanup(commit.sha)
  }

  // Ensure that even branches we haven't found yet are visible, insert a column for each undiscovered branch
  const parentShas = children.remainingParentsToFind()
  for (const parentSha of parentShas) {
    const registeredChildren = children.lookup(parentSha)
    for (const coords of registeredChildren) {
      if (coords.parentIndex == 0) {
        continue
      }

      const column = coords.column + 1
      const colour = colours.next()

      // Make space
      if (coords.parentIndex != 0) {
        for (let i = coords.row + 1; i < nodes.length; i++) {
          const nodesRow = nodes[i]
          const linksRow = links[i]

          nodesRow.splice(
            column,
            0,
            cloneNodeAsBlank(
              commitToNode(
                {
                  sha: coords.sha,
                  parents: [parentSha],
                  purgeOnRehydration: true,
                },
                colour,
              ),
            ),
          )
          for (const link in linksRow) {
            if (link.x1 >= column) link.x1++
            if (link.x2 >= column) link.x2++
          }
          children.insertColumn(column)
        }
      }

      // Insert
      nodes[coords.row][coords.column].secondaryColour = colour
      if (coords.row < links.length - 1) {
        writeLinks(
          coords.row,
          coords.column,
          nodes.length - 1,
          column,
          colour,
          {
            endWithNode: false,
            purgeOnRehydration: true,
          },
        )
      }
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
      children,
      colours,
    },
  }
}
