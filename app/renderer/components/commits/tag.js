import React from 'react'
import PropTypes from 'prop-types'

import styled from 'styled-components'

const Wrapper = styled.div`
  display: inline;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 5px;

  padding-left: 0.2em;
  padding-right: 0.2em;
  padding-bottom: 0.1em;
  margin-right: 0.3em;

  color: rgba(0, 0, 0, 0.5);
`

export default class Tag extends React.Component {
  render() {
    return <Wrapper>{this.props.label}</Wrapper>
  }
}

Tag.propTypes = {
  label: PropTypes.string.isRequired,
}
