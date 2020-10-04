import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Files } from './Files'
import { Diff } from './Diff'

import { useDiffData } from './useDiffData'

export function DiffPanel({
  mode = 'index',
  shaNew = 'bc546e06e8b7e4b561b5b859acb97e0f809eaaaf',
  shaOld = '529bbb2e074ed0cdd5fba316546eeb54704e1d37',
}) {
  const { loading, filePath, setFilePath, filePatch, diff } = useDiffData(
    mode,
    { shaNew, shaOld },
  )

  if (loading) {
    return (
      <DiffContainer>
        <MessageText>Loading</MessageText>
      </DiffContainer>
    )
  }

  return (
    <Row>
      <Files
        patches={diff.patches}
        filePath={filePath}
        onChange={setFilePath}
      />

      <Diff filePatch={filePatch} />
    </Row>
  )
}

DiffPanel.propTypes = {
  mode: PropTypes.oneOf(['shas', 'index']),
  shaNew: PropTypes.string,
  shaOld: PropTypes.string,
}

const Row = styled.div`
  display: flex;
  flex: 1 1 0;
  flex-direction: row;
  height: 100%;

  overflow: hidden;
`

const DiffContainer = styled.div`
  display: flex;
  flex-direction: column;

  overflow: auto;

  flex: 3 3 0;
`

const MessageText = styled.div`
  text-align: center;
`
