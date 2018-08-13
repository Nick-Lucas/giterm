import React from 'react'
import PropTypes from 'prop-types'

import styled from 'styled-components'

const Wrapper = styled.div`
  display: inline;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 5px;

  padding-left: 3px;
  padding-right: 3px;
  padding-bottom: 2px;
  margin-right: 5px;

  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
`

export default class Tag extends React.Component {
  render() {
    return <Wrapper>{this.props.label}</Wrapper>
  }
}

Tag.propTypes = {
  label: PropTypes.string.isRequired,
}
