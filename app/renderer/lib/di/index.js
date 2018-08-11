import React, { Component, PureComponent, Children } from 'react'
import PropTypes from 'prop-types'

const Context = React.createContext({})

export class ServicesProvider extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { services } = this.props
    return (
      <Context.Provider value={services}>
        {Children.only(this.props.children)}
      </Context.Provider>
    )
  }
}

ServicesProvider.propTypes = {
  services: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired,
}

export const bindServices = (servicesToProps) => (WrappedComponent) => {
  class Wrapper extends PureComponent {
    render() {
      return (
        <Context.Consumer>
          {(services) => {
            const props = servicesToProps(services)
            return <WrappedComponent {...this.props} {...props} />
          }}
        </Context.Consumer>
      )
    }
  }

  Wrapper.displayName = `${getDisplayName(WrappedComponent)}Services`

  return Wrapper
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}
