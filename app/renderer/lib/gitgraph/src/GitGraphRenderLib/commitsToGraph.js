import _ from 'lodash'

function commitToNode(commit, column, primaryColour, secondaryColour = null) {
  return {
    type: 'node',
    sha: commit.sha,
    deleted: false,
    orphan: commit.parents.length === 0,
    primaryColour,
    secondaryColour,
    column,
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
    x1,
    y1,
    x2,
    y2,
    colour,
    nodeAtStart,
    nodeAtEnd,
  }
}

class Cursor {
  constructor() {
    this.head = []
    this.workingCopy = []
  }

  getChild = (column) => {
    return this.head[column]
  }

  findChildren = (parentSha) => {
    const children = []
    for (const column in this.head) {
      const trackedCommit = this.head[column]
      if (trackedCommit && trackedCommit.parentSha === parentSha) {
        children.push([parseInt(column), this.head[column]])
      }
    }

    return _.sortBy(children, ([childColumn, child]) => [
      child.parentIndex,
      childColumn,
    ])
  }

  updateColumn = (
    column,
    row,
    sha,
    parentSha,
    allParents,
    colour,
    { symlink = null } = {},
  ) => {
    this.workingCopy[column] = {
      sha,
      parentSha,
      allParents: [...allParents],
      foundParents: [],
      parentIndex: allParents.indexOf(parentSha),
      colour,
      isNode: true,
      row,
      symlink,
    }

    return column
  }

  markParentFound = (column, parentSha) => {
    this.workingCopy[column].foundParents.push(parentSha)
  }

  assignColumn = (
    row,
    sha,
    parentSha,
    allParents,
    colour,
    { symlink = null } = {},
  ) => {
    const columns = this.findChildren(sha).filter(
      ([, child]) => child.parentIndex === 0,
    )
    if (columns.length > 0) {
      throw 'Coding error: Do not use assignColumn when a direct  child already exists'
    }

    let column = 0
    for (; column <= this.workingCopy.length; column++) {
      if (this.workingCopy[column] === undefined) {
        break
      }
    }

    return this.updateColumn(column, row, sha, parentSha, allParents, colour, {
      symlink,
    })
  }

  next = (nextRowIndex) => {
    const links = []

    // Commit to head
    this.head = this.workingCopy
    this.workingCopy = this.workingCopy.map((columnObj) => ({
      ..._.cloneDeep(columnObj),
      isNode: false,
    }))

    // Clean up
    for (const index in this.head) {
      const { foundParents, allParents } = this.head[index]
      if (foundParents.length === allParents.length) {
        this.head[index] = undefined
      }
    }

    // Generate links
    for (const columnStr in this.head) {
      const column = parseInt(columnStr)
      const columnObj = this.head[column]
      if (!columnObj) {
        continue
      }

      const columnFrom = columnObj.symlink === null ? column : columnObj.symlink

      links.push(
        _link(
          nextRowIndex - 1,
          columnFrom,
          nextRowIndex,
          column,
          columnObj.colour,
          {
            nodeAtStart: columnObj.isNode,
            nodeAtEnd: false,
          },
        ),
      )
    }

    return links
  }
}

class ColourTracker {
  constructor() {
    this._colourIndex = -1
  }

  next = () => ++this._colourIndex
}

function rehydrate({ nodes = [], links = [], cursor = {}, colours = {} }) {
  return {
    nodes,
    links,
    cursor: Object.assign(new Cursor(), cursor),
    colours: Object.assign(new ColourTracker(), colours),
  }
}

export function commitsToGraph(commits = [], rehydrationPackage = {}) {
  const { nodes, links, cursor, colours } = rehydrate(rehydrationPackage)

  function prepareNext() {
    const rowLinks = cursor.next(nodes.length)
    links.push(rowLinks)

    return {
      rowLinks,
      rowIndex: nodes.length,
    }
  }

  for (const commit of commits) {
    const { rowLinks, rowIndex } = prepareNext()

    function trackNewBranch() {
      let node = null
      const colour = colours.next()

      const column = cursor.assignColumn(
        rowIndex,
        commit.sha,
        commit.parents[0],
        commit.parents,
        colour,
      )

      node = commitToNode(commit, column, colour)
      nodes.push(node)

      for (const parentSha of commit.parents.slice(1)) {
        const colour = colours.next()

        // Also assign columns to parents, with a symlink to auto-generated links
        cursor.assignColumn(
          rowIndex,
          commit.sha,
          parentSha,
          commit.parents,
          colour,
          {
            symlink: node.column,
          },
        )
        node.secondaryColour = colour
      }
      return node
    }

    const children = cursor.findChildren(commit.sha)
    if (children.length === 0) {
      trackNewBranch()
    } else {
      // Track known parent which may belong to 1 or more children
      let node = null
      let nodeColumn = null
      for (const [childColumn, child] of children) {
        cursor.markParentFound(childColumn, commit.sha)

        if (nodeColumn === null) {
          // if (child.parentIndex == 0) {
          nodeColumn = childColumn
          const colour = child.colour

          node = commitToNode(commit, nodeColumn, colour)
          nodes.push(node)

          cursor.updateColumn(
            nodeColumn,
            rowIndex,
            commit.sha,
            commit.parents[0],
            commit.parents,
            node.primaryColour,
          )

          rowLinks[childColumn].nodeAtEnd = true
        }

        if (!node) {
          // TODO: Need to handle new branches appearing
          throw 'Coding error: NODE SHOULD BE SET'
        }

        rowLinks[childColumn].nodeAtEnd = true
        rowLinks[childColumn].x2 = nodeColumn
      }
    }
  }

  return {
    nodes: nodes.map((node) => {
      // TODO: this is for compatibility, remove this later!
      const row = []
      row[node.column] = node
      for (let col = 0; col < row.length; col++) {
        if (row[col] === undefined) {
          row[col] = {
            type: 'blank',
          }
        }
      }
      return row
    }),
    links,
    commits,
    rehydrationPackage: {
      nodes: [...nodes],
      links: [...links],
      cursor,
      colours,
    },
  }
}
