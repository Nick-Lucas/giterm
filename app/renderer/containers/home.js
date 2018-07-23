import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import Commits from '../components/commits'
import { GITGRAPH_UPDATE } from '../store/gitGraph'

export class Home extends PureComponent {
  render() {
    return (
      <div>
        <Commits />
        <a
          href=""
          style={{ backgroundColor: 'dark-gray', padding: '5px' }}
          onClick={() =>
            this.props.populate([
              { sha: '1234' },
              { sha: '5678' },
              { sha: '4334' },
            ])
          }>
          Populate
        </a>
      </div>
    )
  }
}

export default connect(
  null,
  { populate: (commits) => ({ type: GITGRAPH_UPDATE, payload: commits }) },
)(Home)
