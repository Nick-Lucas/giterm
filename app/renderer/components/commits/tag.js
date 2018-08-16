import React from 'react'
import PropTypes from 'prop-types'

import styled, { css } from 'styled-components'

const Wrapper = styled.div`
  display: inline;
  border-radius: 5px;

  padding-left: 3px;
  padding-right: 3px;
  padding-bottom: 2px;
  margin-right: 5px;

  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;

  background-color: rgba(255, 255, 255, 0.6);
  ${(props) =>
    props.current &&
    css`
      background-color: rgba(200, 255, 200, 0.8);
    `};
`

export default class Tag extends React.Component {
  render() {
    const { current } = this.props
    return <Wrapper current={current}>{this.props.label}</Wrapper>
  }
}

Tag.propTypes = {
  label: PropTypes.string.isRequired,
  current: PropTypes.bool.isRequired,
}
