import React, { useCallback, useMemo, useRef } from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux'

import { DiffEditor, useMonaco, getLanguageByFileType } from 'app/lib/monaco'
import type { editor } from 'monaco-editor'

import type { Store } from 'app/store/reducers.types'

import { FileText } from './useDiffData'
import { useValueEffect } from 'app/lib/hooks'

interface Props {
  left: FileText
  right: FileText
}

export function Diff({ left, right }: Props) {
  const monaco = useMonaco()
  const editorRef = useRef<editor.IStandaloneDiffEditor>()
  const diffMode = useSelector<Store, Store['diff']['diffMode']>(
    (store) => store.diff.diffMode,
  )

  const options: editor.IDiffEditorOptions = useMemo(() => {
    return {
      renderSideBySide: diffMode === 'split',
      readOnly: true,
      renderIndicators: false,
      codeLens: false,
      contextmenu: false,
    }
  }, [diffMode])

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
