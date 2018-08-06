import PropTypes from 'prop-types'

export const columns = PropTypes.arrayOf(
  PropTypes.shape({
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    width: PropTypes.any,
    showsTags: PropTypes.bool,
  }),
)

export const item = PropTypes.shape({
  sha: PropTypes.string,
  message: PropTypes.string,
  authorStr: PropTypes.string,
  dateStr: PropTypes.string,
  isHead: PropTypes.bool,
})

export const data = PropTypes.arrayOf(item)

export const branch = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
  isRemote: PropTypes.bool,
  isHead: PropTypes.bool,
})
export const branches = PropTypes.arrayOf(branch)
