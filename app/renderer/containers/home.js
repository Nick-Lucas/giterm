import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import Commits from '../components/commits'
import { COMMITS_UPDATE } from '../store/commits'

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
              {
                sha: '1234',
                message: 'change the filange to eradicate the rumbling',
              },
              { sha: '5678', message: 'fix typos' },
              {
                sha: '4334',
                message:
                  'add new project type in order to reverse the polarity of the neutron flow',
              },
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
  { populate: (commits) => ({ type: COMMITS_UPDATE, payload: commits }) },
)(Home)
