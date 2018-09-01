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
}
