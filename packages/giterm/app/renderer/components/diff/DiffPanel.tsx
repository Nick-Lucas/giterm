import React from 'react'
import styled from 'styled-components'

import { Panel } from 'app/lib/primitives'
import { LowerPanelMenu } from 'app/components/common'

import { Files } from './Files'
import { Diff } from './Diff'
import { useDiffData } from './useDiffData'

export function DiffPanel() {
  const { loading, filePath, setFilePath, diff, left, right } = useDiffData()

  if (loading || !diff || !left || !right) {
    return (
      <StyledPanel>
        <LowerPanelMenu />

        <DiffContainer>
          <MessageText>Loading</MessageText>
        </DiffContainer>
      </StyledPanel>
    )
  }

  return (
    <StyledPanel>
      <LowerPanelMenu />

      <Files patches={diff.files} filePath={filePath} onChange={setFilePath} />

      <Diff left={left} right={right} />
    </StyledPanel>
  )
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
