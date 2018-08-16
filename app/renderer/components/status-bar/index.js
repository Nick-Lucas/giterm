import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Wrapper = styled.div`
  margin: 5px;
`

const Item = styled.div`
  margin-right: 5px;
  width: 200px;
  max-width: 200px;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export class StatusBar extends React.Component {
  render() {
    const { status, branchName } = this.props.status
    return (
      <Wrapper>
        <Item>Status: {status}</Item>
        <Item>Branch: {branchName}</Item>
        <Item>0 Changed</Item>
        <Item>0 Staged</Item>
      </Wrapper>
    )
  }
}

StatusBar.propTypes = {}

export default connect(({ status }) => ({ status }))(StatusBar)
