import { expect } from 'chai'

import Calculator, { BranchLine } from './branchlines-calculator'
import { Node } from './models/node'
import { Point } from './models/point'

const newNode = (commit) => {
  const n = new Node(commit.sha)
  n.commit = commit
  return n
}

const newXYNode = (commit, x, y) => {
  const n = newNode(commit)
  n.x = x
  n.y = y
  return n
}

const newBranchLine = (allNodes, ...indexes) => {
  const nodes = indexes.map((i) => allNodes[i])

  const b = new BranchLine()
  b.startIndex = indexes[0]
  b.endIndex = indexes[indexes.length - 1]
  b.indexes = indexes
  b.nodes = nodes
  b.nextSha = nodes[nodes.length - 1].commit.parents[0]
  return b
}

const equal = (target, expected) => {
  try {
    expect(JSON.stringify(target)).to.deep.eql(JSON.stringify(expected))
  } catch (_) {
    expect(target).to.deep.eql(expected)
  }
}

context('branchlines calculator', () => {
  let data = () => []

  let calculator
  const calculate = () => {
    calculator = new Calculator()

    const inputs = data()
    inputs.forEach((input, i) => {
      calculator.includeNode(input, i)
    })
  }

  context('includeNode', () => {
    it('should construct a simple branch', () => {
      data = () => [
        newNode({ sha: 'a', parents: ['b'] }),
        newNode({ sha: 'b', parents: ['c'] }),
        newNode({ sha: 'c', parents: ['d'] }),
        newNode({ sha: 'd', parents: [] }),
      ]

      calculate()

      const branches = calculator.branchLines
      const expected = [newBranchLine(data(), 0, 1, 2, 3)]
      equal(branches, expected)
    })

    it('should construct a branch with merge', () => {
      data = () => [
        newNode({ sha: 'a', parents: ['c', 'b'] }),
        /**/ newNode({ sha: 'b', parents: ['c'] }),
        newNode({ sha: 'c', parents: ['d'] }),
        newNode({ sha: 'd', parents: [] }),
      ]

      calculate()

      const branches = calculator.branchLines
      const expected = [
        newBranchLine(data(), 0, 2, 3),
        newBranchLine(data(), 1),
      ]
      equal(branches, expected)
    })

    it('should construct a branch with no merge', () => {
      data = () => [
        newNode({ sha: 'a', parents: ['c'] }),
        /**/ newNode({ sha: 'b', parents: ['c'] }),
        newNode({ sha: 'c', parents: ['d'] }),
        newNode({ sha: 'd', parents: [] }),
      ]

      calculate()

      const branches = calculator.branchLines
      const expected = [
        newBranchLine(data(), 0, 2, 3),
        newBranchLine(data(), 1),
      ]
      equal(branches, expected)
    })

    it('should construct a second branch with many commits and no merge', () => {
      data = () => [
        newNode({ sha: 'a', parents: ['f'] }),
        /**/ newNode({ sha: 'b', parents: ['c'] }),
        /**/ newNode({ sha: 'c', parents: ['d'] }),
        /**/ newNode({ sha: 'd', parents: ['e'] }),
        /**/ newNode({ sha: 'e', parents: ['f'] }),
        newNode({ sha: 'f', parents: ['g'] }),
        newNode({ sha: 'g', parents: [] }),
      ]

      calculate()

      const branches = calculator.branchLines
      const expected = [
        newBranchLine(data(), 0, 5, 6),
        newBranchLine(data(), 1, 2, 3, 4),
      ]
      equal(branches, expected)
    })

    it('should construct a second branch with many commits and a merge', () => {
      data = () => [
        newNode({ sha: 'a', parents: ['f', 'b'] }),
        /**/ newNode({ sha: 'b', parents: ['c'] }),
        /**/ newNode({ sha: 'c', parents: ['d'] }),
        /**/ newNode({ sha: 'd', parents: ['e'] }),
        /**/ newNode({ sha: 'e', parents: ['f'] }),
        newNode({ sha: 'f', parents: ['g'] }),
        newNode({ sha: 'g', parents: [] }),
      ]

      calculate()

      const branches = calculator.branchLines
      const expected = [
        newBranchLine(data(), 0, 5, 6),
        newBranchLine(data(), 1, 2, 3, 4),
      ]
      equal(branches, expected)
    })

    it('should construct something quite complex', () => {
      data = () => [
        newNode({ sha: 'a', parents: ['g', 'c'] }),
        /**/ /**/ newNode({ sha: 'b', parents: ['e'] }),
        /**/ /**/ /**/ newNode({ sha: 'c', parents: ['d'] }),
        /**/ /**/ /**/ newNode({ sha: 'd', parents: ['g'] }),
        /**/ /**/ newNode({ sha: 'e', parents: ['f'] }),
        /**/ /**/ newNode({ sha: 'f', parents: ['h'] }),
        newNode({ sha: 'g', parents: ['k', 'i'] }),
        /**/ /**/ newNode({ sha: 'h', parents: ['k'] }),
        /**/ newNode({ sha: 'i', parents: ['j'] }),
        /**/ newNode({ sha: 'j', parents: ['k'] }),
        newNode({ sha: 'k', parents: [] }),
      ]

      calculate()

      const branches = calculator.branchLines
      const expected = [
        newBranchLine(data(), 0, 6, 10),
        newBranchLine(data(), 2, 3),
        newBranchLine(data(), 1, 4, 5, 7),
        newBranchLine(data(), 8, 9),
      ]
      equal(branches, expected)
    })
  })

  context('retrieve sorting', () => {
    it('complex', () => {
      data = () => [
        // BRANCHLINE 0
        newNode({ sha: 'a', parents: ['g', 'i'] }),
        //        BRANCHLINE 1
        /**/ /**/ newNode({ sha: 'b', parents: ['e'] }),
        //             BRANCHLINE 3
        /**/ /**/ /**/ newNode({ sha: 'c', parents: ['d'] }),
        /**/ /**/ /**/ newNode({ sha: 'd', parents: ['g'] }),
        /**/ /**/ newNode({ sha: 'e', parents: ['f'] }),
        /**/ /**/ newNode({ sha: 'f', parents: ['h'] }),
        newNode({ sha: 'g', parents: ['k'] }),
        /**/ /**/ newNode({ sha: 'h', parents: ['k'] }),
        //   BRANCHLINE 2
        /**/ newNode({ sha: 'i', parents: ['j'] }),
        /**/ newNode({ sha: 'j', parents: ['k'] }),
        newNode({ sha: 'k', parents: [] }),
      ]

      calculate()

      const branchLineIndexes = calculator.retrieve().map((bl) => bl.indexes)
      const expected = [[0, 6, 10], [1, 4, 5, 7], [8, 9], [2, 3]]
      expect(branchLineIndexes).to.have.deep.ordered.members(expected)
    })
  })

  context('numberOfActiveLinesAt', () => {
    it('simple', () => {
      data = () => [
        newNode({ sha: 'a', parents: ['c', 'b'] }),
        /**/ newNode({ sha: 'b', parents: ['c'] }),
        newNode({ sha: 'c', parents: ['d'] }),
        newNode({ sha: 'd', parents: [] }),
      ]

      calculate()

      expect(calculator.numberOfActiveLinesAt(1, 1)).to.equal(1)
      expect(calculator.numberOfActiveLinesAt(0, 2)).to.equal(0)
    })

    it('complex', () => {
      data = () => [
        // BRANCHLINE 0
        newNode({ sha: 'a', parents: ['g', 'i'] }),
        //        BRANCHLINE 1
        /**/ /**/ newNode({ sha: 'b', parents: ['e'] }),
        //             BRANCHLINE 3
        /**/ /**/ /**/ newNode({ sha: 'c', parents: ['d'] }),
        /**/ /**/ /**/ newNode({ sha: 'd', parents: ['g'] }),
        /**/ /**/ newNode({ sha: 'e', parents: ['f'] }),
        /**/ /**/ newNode({ sha: 'f', parents: ['h'] }),
        newNode({ sha: 'g', parents: ['k'] }),
        /**/ /**/ newNode({ sha: 'h', parents: ['k'] }),
        //   BRANCHLINE 2
        /**/ newNode({ sha: 'i', parents: ['j'] }),
        /**/ newNode({ sha: 'j', parents: ['k'] }),
        newNode({ sha: 'k', parents: [] }),
      ]

      calculate()

      // remember that the branchLineIndex parameter is an index ordered by branch commit-index-length
      expect(calculator.numberOfActiveLinesAt(0, 3)).to.equal(0)
      expect(calculator.numberOfActiveLinesAt(1, 3)).to.equal(1)
      expect(calculator.numberOfActiveLinesAt(2, 10)).to.equal(1)
      expect(calculator.numberOfActiveLinesAt(2, 9)).to.equal(1)
      expect(calculator.numberOfActiveLinesAt(2, 9)).to.equal(1)
      expect(calculator.numberOfActiveLinesAt(3, 3)).to.equal(2)
      expect(calculator.numberOfActiveLinesAt(3, 2)).to.equal(2)
      expect(calculator.numberOfActiveLinesAt(3, 0)).to.equal(1)
    })
  })

  context('pointsAroundIndex', () => {
    it('current branch', () => {
      const bl = new BranchLine()
      bl.nodes = [
        newXYNode({ sha: 'a' }, 0, 1),
        newXYNode({ sha: 'b' }, 1, 2),
        newXYNode({ sha: 'c' }, 3, 4),
        newXYNode({ sha: 'd' }, 5, 6),
        newXYNode({ sha: 'e' }, 7, 8),
      ]
      bl.startIndex = 0
      bl.endIndex = 4
      bl.indexes = [0, 1, 2, 3, 4]

      const points = bl.pointsAroundIndex(2)
      expect(points).to.not.be.null
      equal(points, [new Point({ x: 1, y: 2 }), new Point({ x: 5, y: 6 })])
    })

    it('other branch', () => {
      const bl = new BranchLine()
      bl.nodes = [
        newXYNode({ sha: 'a' }, 0, 1),
        newXYNode({ sha: 'b' }, 1, 2),
        newXYNode({ sha: 'd' }, 5, 6),
        newXYNode({ sha: 'e' }, 7, 8),
      ]
      bl.startIndex = 0
      bl.endIndex = 4
      bl.indexes = [0, 1, 3, 4]

      const points = bl.pointsAroundIndex(2)
      expect(points).to.not.be.null
      equal(points, [new Point({ x: 1, y: 2 }), new Point({ x: 5, y: 6 })])
    })

    it('edge of branch 1', () => {
      const bl = new BranchLine()
      bl.nodes = [newXYNode({ sha: 'a' }, 0, 1), newXYNode({ sha: 'e' }, 7, 8)]
      bl.startIndex = 0
      bl.endIndex = 4
      bl.indexes = [0, 4]

      const points = bl.pointsAroundIndex(0)
      expect(points).to.not.be.null
      equal(points, [new Point({ x: 0, y: 1 }), new Point({ x: 7, y: 8 })])
    })

    it('edge of branch 2', () => {
      const bl = new BranchLine()
      bl.nodes = [newXYNode({ sha: 'a' }, 0, 1), newXYNode({ sha: 'e' }, 7, 8)]
      bl.startIndex = 0
      bl.endIndex = 4
      bl.indexes = [0, 4]

      const points = bl.pointsAroundIndex(4)
      expect(points).to.not.be.null
      equal(points, [new Point({ x: 0, y: 1 }), new Point({ x: 7, y: 8 })])
    })

    it('out of range above', () => {
      const bl = new BranchLine()
      bl.startIndex = 1
      bl.endIndex = 4

      const points = bl.pointsAroundIndex(0)
      expect(points).to.be.null
    })

    it('out of range below', () => {
      const bl = new BranchLine()
      bl.startIndex = 0
      bl.endIndex = 4

      const points = bl.pointsAroundIndex(5)
      expect(points).to.be.null
    })

    it('only one node and current', () => {
      const bl = new BranchLine()
      bl.startIndex = 0
      bl.endIndex = 0
      bl.nodes = [{}]
      bl.indexes = [0]

      const points = bl.pointsAroundIndex(0)
      expect(points).to.be.null
    })
  })
})
