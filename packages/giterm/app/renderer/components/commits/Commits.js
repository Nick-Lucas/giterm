import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { List, AutoSizer } from 'react-virtualized'
import _ from 'lodash'
import moment from 'moment'

import Header from './header'
import { reachedEndOfList } from 'app/store/commits/actions'
import { GraphColumnWidth, GraphIndent, RowHeight } from './constants'
import { Commit } from './Commit'
import { useValueEffect } from 'app/lib/hooks'

export function Commits() {
  const dispatch = useDispatch()
  const commits = useSelector((state) => state.commits?.commits) ?? []
  const graphWidth = useSelector((state) => state.graph.width)
  const headSHA = useSelector((state) => state.status.headSHA)

  const listRef = useRef()
  useEffect(() => {
    listRef.current.forceUpdateGrid()
  })

  const columns = useMemo(() => {
    const graphCols = Math.min(8, graphWidth)

    return [
      {
        name: '',
        key: 'graph',
        width: `${GraphIndent + GraphColumnWidth * graphCols}px`,
      },
      { name: 'SHA', key: 'sha7', width: '50px' },
      { name: 'Message', key: 'message', width: '500px', showTags: true },
      { name: 'Author', key: 'authorStr', width: '150px' },
      {
        name: 'Date',
        key: 'dateISO',
        width: '150px',
        format: (value) => moment(value).format('YYYY/MM/DD HH:mm'),
      },
    ]
  }, [graphWidth])

  const [selectedSHA, setSelectedSHA] = useState('')
  const handleSelect = useCallback((commit) => {
    setSelectedSHA(commit.sha)
  }, [])

  useValueEffect(headSHA, () => {
    const index = commits.findIndex((c) => c.sha === headSHA)
    if (index >= 0) {
      setSelectedSHA(headSHA)
      listRef.current.scrollToRow(index)
    }
  })

  const handleReachedEndOfList = useMemo(
    () =>
      _.debounce(
        () => {
          dispatch(reachedEndOfList())
        },
        1000,
        { leading: true, trailing: false },
      ),
    [dispatch],
  )

  const handleScroll = useMemo(
    () =>
      _.throttle(
        ({ clientHeight, scrollHeight, scrollTop }) => {
          if (commits.length === 0) {
            return
          }

          const scrollBottom = scrollTop + clientHeight
          const remainingRows = Math.trunc(
            (scrollHeight - scrollBottom) / RowHeight,
          )
          if (remainingRows < 20) {
            handleReachedEndOfList()
          }
        },
        50,
        { leading: true, trailing: true },
      ),
    [commits.length, handleReachedEndOfList],
  )

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
              overscanRowCount={20}
              rowRenderer={({ index, style }) => (
                <Commit
                  key={commits[index].sha}
                  index={index}
                  style={style}
                  isSelected={selectedSHA === commits[index].sha}
                  onSelect={handleSelect}
                  columns={columns}
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
