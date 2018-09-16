export default class BranchLinesCalculator {
  branchLines = []

  retrieve = () => this.branchLines
  // .sort(
  //   (a, b) =>
  //     b.length() - a.length() ||
  //     b.nodes.length - a.nodes.length ||
  //     b.nextSha.localeCompare(a.nextSha) ||
  //     b.nodes[0].id.localeCompare(a.nodes[0].id),
  // )

  findChildBranchLines = (sha) =>
    this.branchLines.filter((bl) => {
      return bl.nextSha === sha
    })

  includeNode = (node, yIndex) => {
    const [branchLine, ...others] = this.findChildBranchLines(node.commit.sha)
    if (branchLine) {
      // if a line is already expecting this node
      branchLine.append(node, yIndex)
    } else {
      // if no line exists for this node the create it
      this.branchLines.push(
        new BranchLine(node.commit.sha).append(node, yIndex),
      )
    }
    if (others.length > 0) {
      others.forEach((bl) => {
        bl.rootIndex = yIndex
      })
    }

    // if it's a merge then kick off a line expecting the branch parent
    if (node.commit.parents.length > 1) {
      this.branchLines.push(new BranchLine(node.commit.parents[1], yIndex))
    }
  }

  numberOfActiveLinesAt = (branchLineIndex, nodeIndex) => {
    return this.retrieve()
      .slice(0, branchLineIndex)
      .filter(
        (bl) => bl.firstIndex() <= nodeIndex && nodeIndex <= bl.finalIndex(),
      ).length
  }
}

export class BranchLine {
  constructor(expectedSha, mergeIndex = null) {
    this.nodes = []
    this.indexes = []
    this.mergeIndex = mergeIndex
    this.startIndex = null
    this.endIndex = null
    this.rootIndex = null
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

  firstIndex = () => {
    if (this.mergeIndex !== null) {
      return this.mergeIndex
    }
    return this.startIndex
  }

  finalIndex = () => {
    if (this.rootIndex !== null) {
      return this.rootIndex
    }
    return this.endIndex
  }

  forEachNode = (callback, thisArg) => {
    this.nodes.forEach((node, i) => {
      callback.bind(thisArg)(node, this.indexes[i])
    })
  }
}
