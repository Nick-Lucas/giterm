import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { List, AutoSizer } from 'react-virtualized'
import debounce from 'debounce'

import Header from './header'
import { reachedEndOfList } from '../../store/commits/actions'
import { GraphColumnWidth, GraphIndent, RowHeight } from './constants'
import { Commit } from './Commit'

export function Commits() {
  const dispatch = useDispatch()
  const commits = useSelector((state) => state.commits?.commits) ?? []
  const { nodes } = useSelector((state) => state.graph)
  const headSHA = useSelector((state) => state.status.headSHA)

  const listRef = useRef()
  useEffect(() => {
    listRef.current.forceUpdateGrid()
  })

  const columns = useMemo(() => {
    const graphCols = Math.min(
      8,
      nodes.reduce((max, node) => Math.max(node.column + 1, max), 3),
    )

    return [
      {
        name: '',
        key: 'graph',
        width: `${GraphIndent + GraphColumnWidth * graphCols}px`,
      },
      { name: 'SHA', key: 'sha7', width: '50px' },
      { name: 'Message', key: 'message', width: '500px', showTags: true },
      { name: 'Author', key: 'authorStr', width: '150px' },
      { name: 'Date', key: 'dateStr', width: '150px' },
    ]
  }, [nodes])

  const [selectedSHA, setSelectedSHA] = useState('')
  const handleSelect = useCallback((commit) => {
    setSelectedSHA(commit.sha)
  }, [])

  useEffect(() => {
    const index = commits.findIndex((c) => c.sha === headSHA)
    if (index >= 0) {
      setSelectedSHA(headSHA)
      listRef.current.scrollToRow(index)
    }
  }, [commits, headSHA])

  const handleScroll = useMemo(
    () =>
      debounce(
        ({ clientHeight, scrollHeight, scrollTop }) => {
          if (commits.length === 0) {
            return
          }

          const scrollBottom = scrollTop + clientHeight
          const remainingRows = Math.trunc(
            (scrollHeight - scrollBottom) / RowHeight,
          )
          if (remainingRows < 20) {
            dispatch(reachedEndOfList())
          }
        },
        1000,
        true,
      ),
    [commits.length, dispatch],
  )

  // TODO:
  // scrollToSha impl

  return (
    <Wrapper>
      <Header columns={columns} />
      <TableWrapper>
        <AutoSizer>
          {({ width, height }) => (
            <VirtualList
              ref={listRef}
              width={width}
              height={height}
              rowHeight={RowHeight}
              rowCount={commits.length}
              overscanRowCount={50}
              rowRenderer={({ index, style }) => (
                <Commit
                  key={commits[index].sha}
                  index={index}
                  style={style}
                  isSelected={selectedSHA === commits[index].sha}
                  onSelect={handleSelect}
                />
              )}
              onScroll={handleScroll}
            />
          )}
        </AutoSizer>
      </TableWrapper>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`

const TableWrapper = styled.div`
  flex: 1;
`

const VirtualList = styled(List)`
  outline: none;
`
