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

class BranchTracker {
  constructor() {
    this._commitedLayer = []
    this._workingLayer = []
  }

  /** Find the first child of a given sha, prioritised by its closeness by lineage */
  findFirstChild = (parentSha) => {
    const children = []
    for (const column in this._commitedLayer) {
      const trackedCommit = this._commitedLayer[column]
      if (trackedCommit && trackedCommit.parentSha === parentSha) {
        children.push([parseInt(column), this._commitedLayer[column]])
      }
    }

    const firstChild = _.first(
      _.sortBy(children, ([childColumn, child]) => [
        child.parentIndex,
        childColumn,
      ]),
    )

    return firstChild || []
  }

  /** Mark all children as found for a given parent */
  markParentFound = (parentSha) => {
    for (const child of this._workingLayer) {
      if (child && child.parentSha === parentSha) {
        child.parentFound = true
      }
    }
  }

  /** Unassign all children which have been found from the tracker */
  immediatelyUnassignFoundColumns = () => {
    for (const index in this._workingLayer) {
      if (!this._workingLayer[index]) {
        continue
      }
      const { parentFound, orphan } = this._workingLayer[index]
      if (parentFound || orphan) {
        this._workingLayer[index] = undefined
      }
    }
  }

  /** Update a child with its direct parent and look for its grand-parent instead */
  updateColumn = (
    column,
    parentSha,
    commit,
    colour,
    { symlink = null } = {},
  ) => {
    this._workingLayer[column] = {
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

  /** Assign a column to a newly found child and look for its parent */
  assignColumn = (parentSha, commit, colour, { symlink = null } = {}) => {
    let column = 0
    for (; column <= this._workingLayer.length; column++) {
      if (this._workingLayer[column] === undefined) {
        break
      }
    }

    return this.updateColumn(column, parentSha, commit, colour, {
      symlink,
    })
  }

  /** Move the tracker forward ready for new commit and generate links for all tracked children */
  next = () => {
    const links = []

    // Clean up
    this.immediatelyUnassignFoundColumns()

    // Commit to head
    this._commitedLayer = this._workingLayer
    this._workingLayer = this._workingLayer.map(
      (columnObj) =>
        columnObj && {
          ...columnObj,
          isNode: false,
          symlink: null,
        },
    )

    // Generate links
    for (const columnStr in this._commitedLayer) {
      const column = parseInt(columnStr)
      const columnObj = this._commitedLayer[column]
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
  constructor(nodes, links, branchTracker) {
    this.nodes = nodes
    this.links = links
    this.branchTracker = branchTracker

    this._bufferedLinks = []
  }

  addNode = (node) => {
    return this.nodes.push(node)
  }

  /** Buffers a link which has been discovered for the next layer. Will be appended in the next layer */
  addLinkForNextRow(link) {
    this._bufferedLinks.push(link)
  }

  /** Once a parent is found, generated links from the current layer need updating to point to it */
  setChildLinkDestinations(destinationNode) {
    if (_.last(this.nodes) !== destinationNode) {
      throw new Error(
        'Coding Error: destination node is not the latest node in the graph',
      )
    }

    for (const link of _.last(this.links)) {
      if (link.parentSha === destinationNode.sha) {
        link.nodeAtEnd = true
        link.x2 = destinationNode.column
      }
    }
  }

  /** Prepare the graph for a new commit to be worked on */
  prepareNextRow = () => {
    // Move cursor foward to retrieve auto-generated links
    const autoLinks = this.branchTracker.next(this.nodes.length)
    const rowLinks = [...this._bufferedLinks, ...autoLinks]

    // Update state for next cycle
    this._bufferedLinks = []
    this.links.push(rowLinks)
  }

  getGraph = () => ({
    nodes: this.nodes,
    links: this.links,
  })
}

function rehydrate({
  nodes: nodesData = [],
  links: linksData = [],
  branchTracker: branchTrackerData = {},
  colours: coloursData = {},
}) {
  const branchTracker = Object.assign(new BranchTracker(), branchTrackerData)
  const colours = Object.assign(new ColourTracker(), coloursData)

  return {
    graph: new GraphState(nodesData, linksData, branchTracker),
    branchTracker,
    colours,
  }
}

export function commitsToGraph(commits = [], rehydrationPackage = {}) {
  const { graph, branchTracker, colours } = rehydrate(rehydrationPackage)

  for (const commit of commits) {
    graph.prepareNextRow()

    function trackOtherParents(node) {
      branchTracker.immediatelyUnassignFoundColumns()

      const otherParentShas = commit.parents.slice(1)
      for (const parentSha of otherParentShas) {
        const [firstChildColumn, firstChild] = branchTracker.findFirstChild(
          parentSha,
        )

        if (firstChild) {
          // If this is a merge in from another branch with a colour already chosen
          const colour = firstChild.colour

          node.secondaryColour = colour

          graph.addLinkForNextRow(
            _link(
              node.column,
              firstChildColumn,
              colour,
              node.sha,
              firstChild.parentSha,
              {
                nodeAtStart: true,
                nodeAtEnd: false,
              },
            ),
          )
        } else {
          // If this is a merge in from a new branch not yet discovered
          const colour = colours.next()

          node.secondaryColour = colour

          // Assign column to parent, with a symlink so
          //  auto-generated links point back to the current node
          branchTracker.assignColumn(parentSha, commit, colour, {
            symlink: node.column,
          })
        }
      }
    }

    function trackNewBranch() {
      const colour = colours.next()
      const parentSha = commit.parents[0]
      const column = branchTracker.assignColumn(parentSha, commit, colour)

      const node = commitToNode(commit, column, colour)
      graph.addNode(node)

      return node
    }

    function updateTrackedBranch(childColumn, child) {
      const colour = child.colour

      const node = commitToNode(commit, childColumn, colour)
      graph.addNode(node)

      branchTracker.updateColumn(
        node.column,
        commit.parents[0],
        commit,
        node.primaryColour,
      )

      return node
    }

    const [childColumn, child] = branchTracker.findFirstChild(commit.sha)
    if (child == null) {
      const node = trackNewBranch()
      if (commit.parents.length > 1) {
        trackOtherParents(node)
      }
    } else {
      branchTracker.markParentFound(commit.sha)

      const node = updateTrackedBranch(childColumn, child)
      if (commit.parents.length > 1) {
        trackOtherParents(node)
      }

      graph.setChildLinkDestinations(node)
    }
  }

  const { nodes, links } = graph.getGraph()

  return {
    nodes,
    links,
    commits,
    rehydrationPackage: {
      nodes: [...nodes],
      links: [...links],
      branchTracker,
      colours,
    },
  }
}
