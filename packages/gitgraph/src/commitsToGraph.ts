import _ from 'lodash'

type PrimaryColour = number
type SecondaryColour = number | null

export interface Commit {
  sha: string
  parents: string[]
}

export interface Node {
  type: 'node'
  sha: string
  primaryColour: PrimaryColour
  secondaryColour: SecondaryColour
  column: number
}

export interface Link {
  x1: number
  x2: number
  colour: PrimaryColour
  childSha: string
  parentSha: string
  nodeAtStart: boolean
  nodeAtEnd: boolean
}

function commitToNode(
  commit: Commit,
  column: number,
  primaryColour: PrimaryColour,
  secondaryColour: SecondaryColour = null,
): Node {
  return {
    type: 'node',
    sha: commit.sha,
    primaryColour,
    secondaryColour,
    column,
  }
}

export function _link(
  x1: number,
  x2: number,
  colour: PrimaryColour,
  childSha: string,
  parentSha: string,
  { nodeAtStart = true, nodeAtEnd = true } = {},
): Link {
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

interface TrackedBranch {
  isNode: boolean
  sha: string
  parentSha: string
  orphan: boolean
  parentFound: boolean
  parentIndex: number
  colour: PrimaryColour
  symlink: number | null
}

type MaybeTrackedBranch = TrackedBranch | undefined

class BranchTracker {
  _commitedLayer: MaybeTrackedBranch[] = []
  _workingLayer: MaybeTrackedBranch[] = []

  /** Find the first child of a given sha, prioritised by its closeness by lineage */
  findFirstChild = (parentSha: string) => {
    const children: [number, MaybeTrackedBranch][] = []
    for (const column in this._commitedLayer) {
      const trackedCommit = this._commitedLayer[column]
      if (trackedCommit && trackedCommit.parentSha === parentSha) {
        children.push([parseInt(column), this._commitedLayer[column]])
      }
    }

    const firstChild = _.first(
      _.sortBy(children, ([childColumn, child]) => [
        child?.parentIndex,
        childColumn,
      ]),
    )

    return firstChild || []
  }

  /** Mark all children as found for a given parent */
  markParentFound = (parentSha: string) => {
    for (const child of this._workingLayer) {
      if (child && child.parentSha === parentSha) {
        child.parentFound = true
      }
    }
  }

  /** Unassign all children which have been found from the tracker */
  immediatelyUnassignFoundColumns = () => {
    for (const index in this._workingLayer) {
      const child = this._workingLayer[index]
      if (child == undefined) {
        continue
      }

      const { parentFound, orphan } = child
      if (parentFound || orphan) {
        this._workingLayer[index] = undefined
      }
    }
  }

  /** Update a child with its direct parent and look for its grand-parent instead */
  updateColumn = (
    column: number,
    parentSha: string,
    commit: Commit,
    colour: PrimaryColour,
    { symlink = null }: { symlink: number | null } = { symlink: null },
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
  assignColumn = (
    parentSha: string,
    commit: Commit,
    colour: PrimaryColour,
    { symlink = null }: { symlink: number | null } = { symlink: null },
  ) => {
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
  _colourIndex: number = -1

  next = () => ++this._colourIndex
}

class GraphState {
  nodes: (Node | null)[] = []
  links: Link[][] = []
  _linksForNextRow: Link[] = []

  setNode = (node: Node) => {
    this.nodes[this.nodes.length - 1] = node
  }

  /** Buffers a link which has been discovered for the next layer. Will be appended in the next layer */
  addLinkForNextRow(link: Link) {
    this._linksForNextRow.push(link)
  }

  /** Once a parent is found, generated links from the current layer need updating to point to it */
  setChildLinkDestinations(destinationNode: Node) {
    if (_.last(this.nodes) !== destinationNode) {
      throw new Error(
        'Coding Error: destination node is not the latest node in the graph',
      )
    }

    for (const link of _.last(this.links) as Link[]) {
      if (link.parentSha === destinationNode.sha) {
        link.nodeAtEnd = true
        link.x2 = destinationNode.column
      }
    }
  }

  /** Prepare the graph for a new commit to be worked on */
  prepareNextRow = (branchTracker: BranchTracker) => {
    // Finalise iteration
    if (this.nodes.length > 0 && _.last(this.nodes) == null) {
      throw new Error(
        'Coding Error: prepareNextRow called before node was set. Every iteration must set a node',
      )
    }
    if (this.links.length > 0) {
      this.links[this.links.length - 1] = _.sortBy(
        _.last(this.links),
        (link) => link.x1 === link.x2,
      )
    }

    // Move branch tracking foward and generate initial links
    const autoLinks = branchTracker.next()
    const rowLinks = [...this._linksForNextRow, ...autoLinks]

    // Update state for next cycle
    this._linksForNextRow = []
    this.links.push(rowLinks)
    this.nodes.push(null)
  }

  getGraph = () => ({
    nodes: this.nodes,
    links: this.links,
  })
}

function rehydrate({
  graph: graphData = {},
  branchTracker: branchTrackerData = {},
  colours: coloursData = {},
}) {
  const branchTracker = Object.assign(new BranchTracker(), branchTrackerData)
  const colours = Object.assign(new ColourTracker(), coloursData)
  const graph = Object.assign(new GraphState(), graphData)

  return {
    graph,
    branchTracker,
    colours,
  }
}

export function commitsToGraph(
  commits: Commit[] = [],
  rehydrationPackage = {},
) {
  const { graph, branchTracker, colours } = rehydrate(rehydrationPackage)

  for (const commit of commits) {
    graph.prepareNextRow(branchTracker)

    function trackOtherParents(node: Node) {
      branchTracker.immediatelyUnassignFoundColumns()

      const otherParentShas = commit.parents.slice(1)
      for (const parentSha of otherParentShas) {
        const [firstChildColumn, firstChild] = branchTracker.findFirstChild(
          parentSha,
        )

        if (firstChild && typeof firstChildColumn === 'number') {
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
      graph.setNode(node)

      return node
    }

    function updateTrackedBranch(childColumn: number, child: TrackedBranch) {
      const colour = child.colour

      const node = commitToNode(commit, childColumn, colour)
      graph.setNode(node)

      branchTracker.updateColumn(
        node.column,
        commit.parents[0],
        commit,
        node.primaryColour,
      )

      return node
    }

    const [childColumn, child] = branchTracker.findFirstChild(commit.sha)
    if (child != null && typeof childColumn === 'number') {
      branchTracker.markParentFound(commit.sha)

      const node = updateTrackedBranch(childColumn, child)
      if (commit.parents.length > 1) {
        trackOtherParents(node)
      }

      graph.setChildLinkDestinations(node)
    } else {
      const node = trackNewBranch()
      if (commit.parents.length > 1) {
        trackOtherParents(node)
      }
    }
  }

  const { nodes, links } = graph.getGraph()

  return {
    nodes: [...nodes],
    links: [...links],
    commits,
    rehydrationPackage: {
      graph,
      branchTracker,
      colours,
    },
  }
}
