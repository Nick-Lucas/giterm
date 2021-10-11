import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { List } from 'app/lib/primitives'

import { DiffEditor } from 'app/lib/monaco'
import type { editor } from 'monaco-editor'

export function Diff({ filePatch }) {
  const isRenamed =
    filePatch.oldName !== filePatch.newName &&
    !!filePatch.oldName &&
    !!filePatch.newName

  const options: editor.IDiffEditorOptions = {
    renderSideBySide: false,
    renderOverviewRuler: false,
  }

  return (
    <DiffContainer>
      <PatchName>
        {isRenamed ? (
          <>
            <List.Label trimStart textAlign="right">
              {filePatch.newName}
            </List.Label>
            <PatchNameSeparator>{'->'}</PatchNameSeparator>
            <List.Label trimStart>{filePatch.oldName}</List.Label>
          </>
        ) : (
          <List.Label trimStart textAlign="center">
            {filePatch.oldName ?? filePatch.selectedFileName}
          </List.Label>
        )}
      </PatchName>

      <DiffEditor
        original={JSON.stringify(filePatch, null, 2)}
        modified={JSON.stringify({ foo: filePatch }, null, 2)}
        theme="vs-dark"
        options={options}
      />
    </DiffContainer>
  )
}

Diff.propTypes = {
  filePatch: PropTypes.object.isRequired,
}

const DiffContainer = styled.div`
  display: flex;
  flex-direction: column;

  overflow: auto;

  flex: 3 3 0;
`

const PatchName = styled.div`
  display: flex;
  flex: 0 0 auto;

  flex-direction: row;
  align-items: center;
  justify-content: center;

  padding: 0 1rem;

  font-style: italic;
`

const PatchNameSeparator = styled.div`
  padding: 0 0.5rem;
`
