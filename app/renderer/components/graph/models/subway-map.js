import * as d3 from 'd3'
console.log(d3)

export class SubwayMap {
  nodes = []
  links = []
  nodeDict
  width = 0

  initialized() {
    return this._initialized
  }
  _initialized = false
  constructor(nodes, links, nodeDict) {
    this.nodes = nodes
    this.links = links
    this.nodeDict = nodeDict
  }

  initGraph() {
    d3.selectAll('#graph-root').data(this.nodes)
    this._initialized = true
  }

  scrollTo(commit) {
    const node = document.getElementById(`commit-info-${commit}`)
    if (node) {
      node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    }
  }

  updateCommitStatus(commit, status) {
    if (this.nodeDict[commit]) {
      this.nodeDict[commit].commit.ci = status
    }
  }
}
