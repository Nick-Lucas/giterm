import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Panel } from 'app/lib/primitives'
import { LowerPanelMenu } from 'app/components/common'

import { Files } from './Files'
import { Diff } from './Diff'
import { useDiffData } from './useDiffData'

import { DiffEditor } from "app/lib/monaco";

export function DiffPanel() {
  const { loading, filePath, setFilePath, filePatch, diff } = useDiffData()

  if (loading || !diff) {
    return (
      <DiffContainer>
        <MessageText>Loading</MessageText>
      </DiffContainer>
    )
  }

  return (
    <StyledPanel>
      <LowerPanelMenu />

      <Files patches={diff.files} filePath={filePath} onChange={setFilePath} />

      {/* <Diff filePatch={filePatch} /> */}

      <DiffEditor original={JSON.stringify(filePatch, null, 2)} modified={JSON.stringify(filePatch, null, 2)} theme="vs-dark" />
    </StyledPanel>
  )
}

DiffPanel.propTypes = {
  mode: PropTypes.oneOf(['shas', 'index']),
  shaNew: PropTypes.string,
  shaOld: PropTypes.string,
}

const StyledPanel = styled(Panel)`
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
