import React, { useCallback, useMemo, useRef } from 'react'
import styled from 'styled-components'

import { List } from 'app/lib/primitives'

import { DiffEditor, useMonaco, getLanguageByFileType } from 'app/lib/monaco'
import type { editor } from 'monaco-editor'

import { FileText } from './useDiffData'
import { useValueEffect } from 'app/lib/hooks'

interface Props {
  left: FileText
  right: FileText
}

export function Diff({ left, right }: Props) {
  const monaco = useMonaco()
  const editorRef = useRef<editor.IStandaloneDiffEditor>()
  const isRenamed = left.path !== right.path

  const options: editor.IDiffEditorOptions = useMemo(() => {
    return {
      renderSideBySide: true,
      readOnly: true,
      renderIndicators: false,
      codeLens: false,
      contextmenu: false,
    }
  }, [])

  const [leftLang, rightLang] = useMemo(() => {
    if (!monaco) {
      return ['', '']
    }

    return getLanguageByFileType(monaco, [left.type, right.type])
  }, [left.type, monaco, right.type])

  useValueEffect(
    left.path,
    useCallback(() => {
      if (editorRef.current) {
        editorRef.current.revealPosition({ column: 0, lineNumber: 0 }, 1)
      }
    }, []),
  )

  return (
    <DiffContainer>
      <PatchName>
        {isRenamed ? (
          <>
            <List.Label trimStart textAlign="right">
              {left.path || '(Created)'}
            </List.Label>
            <PatchNameSeparator>{'->'}</PatchNameSeparator>
            <List.Label trimStart>{right.path || '(Deleted)'}</List.Label>
          </>
        ) : (
          <List.Label trimStart textAlign="center">
            {right.path}
          </List.Label>
        )}
      </PatchName>

      <DiffEditor
        original={left.text}
        modified={right.text}
        theme="giterm-dark"
        options={options}
        originalLanguage={leftLang}
        modifiedLanguage={rightLang}
        onMount={(editor) => (editorRef.current = editor)}
      />
    </DiffContainer>
  )
}

const DiffContainer = styled.div`
  display: flex;
  flex-direction: column;

  overflow: hidden;

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
