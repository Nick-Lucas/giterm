import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { SubwayCalculator } from './subway-calculator'
import PathLine from './pathline'

export class Graph extends React.Component {
  constructor(props) {
    super(props)
    this.calculator = new SubwayCalculator(props.rowHeight)
    this.graph = this.calculator.getSubwayMap(props.commits)

    this.state = {
      initialised: false,
    }
  }

  componentDidUpdate() {
    this.calculator = new SubwayCalculator(this.props.rowHeight)
    this.graph = this.calculator.getSubwayMap(this.props.commits)
  }

  getPathLinePoints(link) {
    const x1 = link.source.x
    const y1 = link.source.y
    const x2 = link.target.x
    const y2 = link.target.y
    return [
      { x: x1, y: y1 },
      // { x: x1, y: lerp(y1, y2, 0.4) },
      // { x: lerp(x1, x2, 0.6), y: y2 },
      x1 < x2 ? { x: x2, y: y1 } : { x: x1, y: y2 },

      { x: x2, y: y2 },
    ]
  }

  render() {
    this.calculator.updateCommits(this.props.commits)

    return (
      <svg id="graph-root" width="100%" height="100%">
        <g>
          {this.graph.links.map((link) => (
            <PathLine
              key={link.sourceSha() + '__' + link.targetSha()}
              points={this.getPathLinePoints(link)}
              stroke={link.color.stringValue()}
              strokeWidth={3}
              fill="none"
              r={5}
            />
          ))}
          {this.graph.nodes.map((node) => (
            <circle
              key={node.commit.sha}
              cx={node.x}
              cy={node.y}
              fill={node.color.stringValue()}
              r={5}
            />
          ))}
        </g>
      </svg>
    )
  }
}

Graph.propTypes = {
  rowHeight: PropTypes.number.isRequired,
}

function lerp(a, b, fraction) {
  return a + (b - a) * fraction
}

export default connect(({ commits }) => ({ commits }))(Graph)
