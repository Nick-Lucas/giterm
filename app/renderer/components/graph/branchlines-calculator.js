import { Point } from './models/point'

export default class BranchLinesCalculator {
  branchLines = []

  retrieve = () =>
    this.branchLines.sort(
      (a, b) => b.length() - a.length() || b.nodes.length - a.nodes.length,
    )

  findChildBranchLine = (sha) =>
    this.branchLines.find((bl) => {
      return bl.nextSha === sha
    })

  includeNode = (node, yIndex) => {
    const branchLine = this.findChildBranchLine(node.commit.sha)
    if (branchLine) {
      // if a line is already expecting this node
      branchLine.append(node, yIndex)
    } else {
      // if no line exists for this node the create it
      this.branchLines.push(
        new BranchLine(node.commit.sha).append(node, yIndex),
      )
    }

    // if it's a merge then kick off a line expecting the branch parent
    if (node.commit.parents.length > 1) {
      this.branchLines.push(new BranchLine(node.commit.parents[1]))
    }
  }

  numberOfActiveLinesAt = (branchLineIndex, nodeIndex) => {
    return this.retrieve()
      .slice(0, branchLineIndex)
      .filter((bl) => bl.startIndex <= nodeIndex && nodeIndex <= bl.endIndex)
      .length
  }
}

export class BranchLine {
  constructor(expectedSha) {
    this.nodes = []
    this.indexes = []
    this.startIndex = null
    this.endIndex = null
    this.nextSha = expectedSha
  }

  append = (node, index) => {
    this.nodes.push(node)
    this.indexes.push(index)
    if (this.startIndex === null) {
      this.startIndex = index
    }
    this.endIndex = index
    this.nextSha = node.commit.parents[0]

    return this
  }

  length = () => this.endIndex - this.startIndex

  forEachNode = (callback, thisArg) => {
    this.nodes.forEach((node, i) => {
      callback.bind(thisArg)(node, this.indexes[i])
    })
  }

  indexInThisBranch = (searchIndex) => this.indexes.indexOf(searchIndex) >= 0

  pointsAroundIndex = (searchIndex) => {
    if (
      searchIndex < this.startIndex ||
      searchIndex > this.endIndex ||
      this.nodes.length <= 1
    ) {
      return null
    }

    // TODO: on massive branches do a binary search, maybe?

    let above = 0
    let below = this.indexes.length - 1
    for (let i = 0; i < this.indexes.length - 1; i++) {
      const nodeIndex = this.indexes[i]
      const iBelow = i + 1
      const nodeIndexBelow = this.indexes[iBelow]

      if (nodeIndex < searchIndex && nodeIndexBelow >= searchIndex) {
        above = i

        if (nodeIndexBelow === searchIndex) {
          if (iBelow < this.indexes.length - 1) {
            below = iBelow + 1
          }
        } else {
          below = iBelow
        }

        break
      }
    }

    return [new Point(this.nodes[above]), new Point(this.nodes[below])]
  }
}
