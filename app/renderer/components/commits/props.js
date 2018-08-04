import PropTypes from 'prop-types'

export const columns = PropTypes.arrayOf(
  PropTypes.shape({
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    width: PropTypes.any,
  }),
)

export const item = PropTypes.shape({
  sha: PropTypes.string,
  message: PropTypes.string,
})

export const data = PropTypes.arrayOf(item)
