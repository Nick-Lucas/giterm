import _ from 'lodash'

function commitToNode(commit, column, primaryColour, secondaryColour = null) {
  return {
    type: 'node',
    sha: commit.sha,
    primaryColour,
    secondaryColour,
    column,
  }
}

export function _link(
  x1,
  x2,
  colour,
  childSha,
  parentSha,
  { nodeAtStart = true, nodeAtEnd = true } = {},
) {
  return {
    x1,
    x2,
    colour,
    childSha,
    parentSha,
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

  findChildWithParentIndex0 = (parentSha) => {
    const [firstChild] = this.findChildren(parentSha)
    if (firstChild && firstChild[1].parentIndex === 0) {
      return firstChild
    }
    return []
  }

  markParentFound = (parentSha) => {
    for (const child of this.workingCopy) {
      if (child && child.parentSha === parentSha) {
        child.parentFound = true
      }
    }
  }

  immediatelyUnassignFoundColumns = () => {
    for (const index in this.workingCopy) {
      if (!this.workingCopy[index]) {
        continue
      }
      const { parentFound, orphan } = this.workingCopy[index]
      if (parentFound || orphan) {
        this.workingCopy[index] = undefined
      }
    }
  }

  updateColumn = (
    column,
    parentSha,
    commit,
    colour,
    { symlink = null } = {},
  ) => {
    this.workingCopy[column] = {
      isNode: true,
      sha: commit.sha,
      parentSha,
      orphan: commit.parents.length === 0,
      parentFound: false,
      parentIndex: commit.parents.indexOf(parentSha),
      colour,
      symlink,
    }

    return column
  }

  assignColumn = (parentSha, commit, colour, { symlink = null } = {}) => {
    let column = 0
    for (; column <= this.workingCopy.length; column++) {
      if (this.workingCopy[column] === undefined) {
        break
      }
    }

    return this.updateColumn(column, parentSha, commit, colour, {
      symlink,
    })
  }

  next = () => {
    const links = []

    // Clean up
    this.immediatelyUnassignFoundColumns()

    // Commit to head
    this.head = this.workingCopy
    this.workingCopy = this.workingCopy.map(
      (columnObj) =>
        columnObj && {
          ..._.cloneDeep(columnObj),
          isNode: false,
          symlink: null,
        },
    )

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
          columnFrom,
          column,
          columnObj.colour,
          columnObj.sha,
          columnObj.parentSha,
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

class GraphState {
  constructor(nodes, links, cursor) {
    this.nodes = nodes
    this.links = links
    this.cursor = cursor

    this._bufferedLinks = []
  }

  addNode = (node) => {
    return this.nodes.push(node)
  }

  addLinkForNextRow(link) {
    this._bufferedLinks.push(link)
  }

  prepareNext = () => {
    // Move cursor foward to retrieve auto-generated links
    const autoLinks = this.cursor.next(this.nodes.length)
    const rowLinks = [...autoLinks, ...this._bufferedLinks]

    // Update state for next cycle
    this._bufferedLinks = []
    this.links.push(rowLinks)

    return {
      rowLinks,
    }
  }

  getGraph = () => ({
    nodes: this.nodes,
    links: this.links,
  })
}

function rehydrate({
  nodes: nodesData = [],
  links: linksData = [],
  cursor: cursorData = {},
  colours: coloursData = {},
}) {
  const cursor = Object.assign(new Cursor(), cursorData)
  const colours = Object.assign(new ColourTracker(), coloursData)

  return {
    graph: new GraphState(nodesData, linksData, cursor),
    cursor,
    colours,
  }
}

export function commitsToGraph(commits = [], rehydrationPackage = {}) {
  const { graph, cursor, colours } = rehydrate(rehydrationPackage)

  for (const commit of commits) {
    const { rowLinks } = graph.prepareNext()

    function trackOtherParents(node) {
      cursor.immediatelyUnassignFoundColumns()

      for (const parentSha of commit.parents.slice(1)) {
        let colour = null

        const [
          firstChildOfParentColumn,
          firstChildOfParent,
        ] = cursor.findChildWithParentIndex0(parentSha)

        if (firstChildOfParent && firstChildOfParent.parentIndex === 0) {
          // If this is a merge in from another branch with a colour already chosen
          colour = firstChildOfParent.colour

          graph.addLinkForNextRow(
            _link(
              node.column,
              firstChildOfParentColumn,
              colour,
              node.sha,
              firstChildOfParent.parentSha,
              {
                nodeAtStart: true,
                nodeAtEnd: false,
              },
            ),
          )
        } else {
          // If this is a merge in from a new branch not yet discovered
          colour = colours.next()

          // Assign column to parent, with a symlink so
          //  auto-generated links point back to the current node
          cursor.assignColumn(parentSha, commit, colour, {
            symlink: node.column,
          })
        }

        node.secondaryColour = colour
      }
    }

    function trackNewBranch() {
      let node = null
      const colour = colours.next()
      const parentSha = commit.parents[0]

      const column = cursor.assignColumn(parentSha, commit, colour)

      node = commitToNode(commit, column, colour)
      graph.addNode(node)

      if (commit.parents.length > 1) {
        trackOtherParents(node)
      }

      return node
    }

    const children = cursor.findChildren(commit.sha)
    if (children.length === 0) {
      trackNewBranch()
    } else {
      // Track known parent which may belong to 1 or more children
      let node = null
      for (const [childColumn, child] of children) {
        cursor.markParentFound(commit.sha)

        if (node === null) {
          const colour = child.colour

          node = commitToNode(commit, childColumn, colour)
          graph.addNode(node)

          cursor.updateColumn(
            node.column,
            commit.parents[0],
            commit,
            node.primaryColour,
          )

          if (commit.parents.length > 1) {
            trackOtherParents(node)
          }
        }
      }

      if (!node) {
        // TODO: Need to handle new branches appearing
        throw 'Coding error: NODE SHOULD BE SET'
      }

      for (const link of rowLinks) {
        if (link.parentSha === node.sha) {
          link.nodeAtEnd = true
          link.x2 = node.column
        }
      }
    }
  }

  const { nodes, links } = graph.getGraph()

  return {
    nodes,
    // TODO: reverse this at a better time, or insert links in the best order for presentation to begin with
    links: links.map((rowLinks) => _.reverse(rowLinks)),
    commits,
    rehydrationPackage: {
      nodes: [...nodes],
      links: [...links],
      cursor,
      colours,
    },
  }
}
