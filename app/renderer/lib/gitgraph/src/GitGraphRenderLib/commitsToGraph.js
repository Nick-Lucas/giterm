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

  updateColumn = (column, sha, parentSha, allParents, colour) => {
    this.workingCopy[column] = {
      sha,
      parentSha,
      allParents: [...allParents],
      foundParents: [],
      parentIndex: allParents.indexOf(parentSha),
      colour,
      isNode: true,
    }

    return column
  }

  markParentFound = (column, parentSha) => {
    this.workingCopy[column].foundParents.push(parentSha)
  }

  assignColumn = (sha, parentSha, allParents, colour) => {
    const columns = this.findChildren(sha)
    if (columns.length > 0) {
      throw 'Coding error: Do not use assignColumn when a child already exists'
    }

    let column = 0
    for (; column <= this.head.length; column++) {
      if (this.head[column] === undefined) {
        break
      }
    }

    return this.updateColumn(column, sha, parentSha, allParents, colour)
  }

  next = (nextRowIndex) => {
    const links = []

    // Clean up
    for (const index in this.head) {
      const { foundParents, allParents } = this.head[index]
      if (foundParents.length === allParents.length) {
        this.head[index] = undefined
      }
    }

    // Generate links
    for (const columnStr in this.workingCopy) {
      const column = parseInt(columnStr)
      const columnObj = this.workingCopy[column]
      links.push(
        _link(
          nextRowIndex - 1,
          column,
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

    // Commit to head
    this.head = this.workingCopy
    this.workingCopy = this.workingCopy.map((columnObj) => ({
      ...columnObj,
      isNode: false,
    }))

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
      for (const parentIndex in commit.parents) {
        const parentSha = commit.parents[parentIndex]
        const colour = colours.next()

        const column = cursor.assignColumn(
          commit.sha,
          parentSha,
          commit.parents,
          colour,
        )

        if (parentIndex == 0) {
          node = commitToNode(commit, column, colour)
          nodes.push(node)
        }
        if (parentIndex == 1) {
          node.secondaryColour = colour
        }
      }
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

        if (nodeColumn === null && child.parentIndex === 0) {
          nodeColumn = childColumn
          const colour = child.colour

          node = commitToNode(commit, nodeColumn, colour)
          nodes.push(node)

          cursor.updateColumn(
            nodeColumn,
            commit.sha,
            commit.parents[0],
            commit.parents,
            node.primaryColour,
          )
          if (commit.parents.length > 1) {
            const colour = colours.next()

            node.secondaryColour = colour
            // TODO: node may have other parents, which may or may not already be tracked
            throw 'NOT IMPLEMENTED YET'
            // const column = cursor.
          }
        }

        if (!node) {
          // TODO: Need to handle new branches appearing
          throw 'Coding error: NODE SHOULD BE SET'
        }

        for (const link of rowLinks) {
          if (link.x1 === childColumn) {
            link.nodeAtEnd = true
            link.x2 = nodeColumn
          }
        }
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
