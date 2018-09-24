import { expect } from 'chai'

import Calculator, { BranchLine } from './branchlines-calculator'
import { Node } from './models/node'

const newNode = (commit) => {
  const n = new Node(commit.sha)
  n.commit = commit
  return n
}

const newBranchLine = (
  allNodes,
  indexes = [],
  rootIndex = null,
  mergeIndex = null,
) => {
  const nodes = indexes.map((i) => allNodes[i])

  const b = new BranchLine()
  b.startIndex = indexes[0]
  b.endIndex = indexes[indexes.length - 1]
  b.rootIndex = rootIndex
  b.mergeIndex = mergeIndex

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
      const expected = [newBranchLine(data(), [0, 1, 2, 3])]
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
        newBranchLine(data(), [0, 2, 3]),
        newBranchLine(data(), [1], 2, 0),
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
        newBranchLine(data(), [0, 2, 3]),
        newBranchLine(data(), [1], 2),
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
        newBranchLine(data(), [0, 5, 6]),
        newBranchLine(data(), [1, 2, 3, 4], 5),
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
        newBranchLine(data(), [0, 5, 6]),
        newBranchLine(data(), [1, 2, 3, 4], 5, 0),
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
        newBranchLine(data(), [0, 6, 10]),
        newBranchLine(data(), [2, 3], 6, 0),
        newBranchLine(data(), [1, 4, 5, 7], 10),
        newBranchLine(data(), [8, 9], 10, 6),
      ]
      equal(branches, expected)
    })
  })

  context('retrieve sorted in order of branch discovery', () => {
    it('complex', () => {
      data = () => [
        // BRANCHLINE 0
        newNode({ sha: 'a', parents: ['g', 'i'] }),
        //        BRANCHLINE 2
        /**/ /**/ newNode({ sha: 'b', parents: ['e'] }),
        //             BRANCHLINE 3
        /**/ /**/ /**/ newNode({ sha: 'c', parents: ['d'] }),
        /**/ /**/ /**/ newNode({ sha: 'd', parents: ['g'] }),
        /**/ /**/ newNode({ sha: 'e', parents: ['f'] }),
        /**/ /**/ newNode({ sha: 'f', parents: ['h'] }),
        newNode({ sha: 'g', parents: ['k'] }),
        /**/ /**/ newNode({ sha: 'h', parents: ['k'] }),
        //   BRANCHLINE 1
        /**/ newNode({ sha: 'i', parents: ['j'] }),
        /**/ newNode({ sha: 'j', parents: ['k'] }),
        newNode({ sha: 'k', parents: [] }),
      ]

      calculate()

      const branchLineIndexes = calculator.retrieve().map((bl) => bl.indexes)
      const expected = [[0, 6, 10], [8, 9], [1, 4, 5, 7], [2, 3]]
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

    context('complex', () => {
      beforeEach(() => {
        data = () => [
          // BRANCHLINE 0
          newNode({ sha: 'a', parents: ['g', 'i'] }),
          //        BRANCHLINE 2
          /**/ /**/ newNode({ sha: 'b', parents: ['e'] }),
          //             BRANCHLINE 3
          /**/ /**/ /**/ newNode({ sha: 'c', parents: ['d'] }),
          /**/ /**/ /**/ newNode({ sha: 'd', parents: ['g'] }),
          /**/ /**/ newNode({ sha: 'e', parents: ['f'] }),
          /**/ /**/ newNode({ sha: 'f', parents: ['h'] }),
          newNode({ sha: 'g', parents: ['k'] }),
          /**/ /**/ newNode({ sha: 'h', parents: ['k'] }),
          //   BRANCHLINE 1
          /**/ newNode({ sha: 'i', parents: ['j'] }),
          /**/ newNode({ sha: 'j', parents: ['k'] }),
          newNode({ sha: 'k', parents: [] }),
        ]

        calculate()
      })

      it('branch 0, index 3', () => {
        expect(calculator.numberOfActiveLinesAt(0, 3)).to.equal(0)
      })
      it('branch 1, index 3', () => {
        expect(calculator.numberOfActiveLinesAt(1, 3)).to.equal(1)
      })
      it('branch 2, index 9', () => {
        expect(calculator.numberOfActiveLinesAt(2, 9)).to.equal(2)
      })
      it('branch 3, index 3', () => {
        expect(calculator.numberOfActiveLinesAt(3, 3)).to.equal(3)
      })
      it('branch 3, index 2', () => {
        expect(calculator.numberOfActiveLinesAt(3, 2)).to.equal(3)
      })

      // These two are edge case-y and I sort of expect them to be broken.
      // They're actually unrealistic since only one branch could be alive at the start or end of the list anyway
      // So the answer would be always be 0 when queried by THAT branch
      it('branch 2, index 10', () => {
        expect(calculator.numberOfActiveLinesAt(2, 10)).to.equal(0)
      })
      it('branch 3, index 0', () => {
        expect(calculator.numberOfActiveLinesAt(3, 0)).to.equal(2)
      })
    })

    context('crossing branches', () => {
      beforeEach(() => {
        data = () => [
          // BRANCHLINE 0
          newNode({ sha: 'a0', parents: ['a1'] }),
          //        BRANCHLINE 1
          /**/ /**/ newNode({ sha: 'c1', parents: ['c2'] }),
          newNode({ sha: 'a1', parents: ['a2'] }),
          /**/ /**/ newNode({ sha: 'c2', parents: ['a3'] }),
          newNode({ sha: 'a2', parents: ['a3', 'b1'] }),
          newNode({ sha: 'a3', parents: ['a4'] }),
          // BRANCHLINE 2
          /**/ newNode({ sha: 'b1', parents: ['a4'] }),
          newNode({ sha: 'a4', parents: [] }),
        ]

        calculate()
      })

      it("at branch1's first commit", () => {
        expect(calculator.numberOfActiveLinesAt(2, 3)).to.equal(2)
      })

      it('merge of branch2', () => {
        expect(calculator.numberOfActiveLinesAt(1, 4)).to.equal(1)
        expect(calculator.numberOfActiveLinesAt(2, 4)).to.equal(2)
      })

      it('first commit on branch2 should detect 2 branches as its root tail overlaps', () => {
        expect(calculator.numberOfActiveLinesAt(2, 6)).to.equal(2)
      })
    })
  })
})
