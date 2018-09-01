import React from 'react'
import { connect } from 'react-redux'
import styled, { css } from 'styled-components'

import { ArrowUp, ArrowDown } from 'react-feather'
import { updateShowRemoteBranches } from '../../store/config'
import { bindServices } from '../../lib/di'

const Wrapper = styled.div`
  margin: 5px;
`

const Group = styled.div`
  margin-right: 5px;

  ${(props) =>
    props.width &&
    css`
      min-width: ${props.width}px;
      max-width: ${props.width}px;
    `};
`

const Item = styled.div`
  margin-right: 5px;
  align-items: center;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  ${(props) =>
    props.width &&
    css`
      min-width: ${props.width}px;
      max-width: ${props.width}px;
    `};
`

const ToggleInput = styled.input`
  margin: 0;
  align-self: flex-end;
  margin-bottom: 1px;
`

export class StatusBar extends React.Component {
  toggleShowRemoteBranches = () => {
    const { showRemoteBranches, gitService } = this.props
    this.props.updateShowRemoteBranches(!showRemoteBranches, gitService)
  }

  render() {
    const {
      state = '',
      current = '',
      ahead = 0,
      behind = 0,
      files = [],
      staged = [],
    } = this.props.status
    const { showRemoteBranches } = this.props
    return (
      <Wrapper>
        <Group width={250}>
          <Item>Status: {state}</Item>
          <Item>
            {staged.length}/{files.length}
          </Item>
        </Group>
        <Group width={300}>
          <Item>Branch: {current}</Item>
          <Item>
            <ArrowUp size={15} />
            {ahead}
            <ArrowDown size={15} />
            {behind}
          </Item>
        </Group>
        <Group>
          <Item>Show Remote</Item>
          <ToggleInput
            type="checkbox"
            onChange={this.toggleShowRemoteBranches}
            checked={showRemoteBranches}
          />
        </Group>
      </Wrapper>
    )
  }
}

StatusBar.propTypes = {}

const ConnectedStatusBar = connect(
  ({ status, config: { showRemoteBranches } }) => ({
    status,
    showRemoteBranches,
  }),
  { updateShowRemoteBranches },
)(StatusBar)

export default bindServices(({ git }) => ({ gitService: git }))(
  ConnectedStatusBar,
)
