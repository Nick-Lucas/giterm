import { expect } from 'chai'

import Calculator, { BranchLine } from './branchlines-calculator'
import { Node } from './models/node'

const newNode = (commit) => {
  const n = new Node(commit.sha)
  n.commit = commit
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

    it('should construct a branch with many commits and no merge', () => {
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

    it('should construct a branch with many commits and a merge', () => {
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
  })
})
