import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'

import { ArrowUp, ArrowDown } from 'react-feather'

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

export class StatusBar extends React.Component {
  render() {
    const { state, current, ahead, behind, files, staged } = this.props.status
    return (
      <Wrapper>
        <Group width={250}>
          <Item>Status: {state}</Item>
          <Item>
            {files.length - staged.length}/{staged.length}
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
      </Wrapper>
    )
  }
}

StatusBar.propTypes = {}

export default connect(({ status }) => ({ status }))(StatusBar)
