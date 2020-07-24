import PropTypes from 'prop-types'

export const columns = PropTypes.arrayOf(
  PropTypes.shape({
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    width: PropTypes.any,
    showsTags: PropTypes.bool,
    skipRowRender: PropTypes.bool,
  }),
)

export const commit = PropTypes.shape({
  sha: PropTypes.string,
  message: PropTypes.string,
  authorStr: PropTypes.string,
  dateStr: PropTypes.string,
  isHead: PropTypes.bool,
})

export const commits = PropTypes.arrayOf(commit)

export const REF_TYPE_BRANCH = 'branch'
export const REF_TYPE_REMOTE_BRANCH = 'remote-branch'
export const REF_TYPE_TAG = 'tag'
export const refTypes = PropTypes.oneOf([
  REF_TYPE_BRANCH,
  REF_TYPE_REMOTE_BRANCH,
  REF_TYPE_TAG,
])
export const ref = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
  isRemote: PropTypes.bool,
  isHead: PropTypes.bool,
  type: refTypes.isRequired,
})
export const refs = PropTypes.arrayOf(ref)
