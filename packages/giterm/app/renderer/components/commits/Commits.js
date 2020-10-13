import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { FixedSizeList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import InfiniteLoader from 'react-window-infinite-loader'
import _ from 'lodash'
import moment from 'moment'
import { CtrlOrCmdHeld } from 'app/lib/keyhelpers'
import { diffShas } from 'app/store/diff/actions'

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

  const [selectedCommits, setSelectedCommits] = useState([])
  const selectedShas = useMemo(() => selectedCommits.map((c) => c.sha), [
    selectedCommits,
  ])
  const handleSelect = useCallback(
    (e, commit) => {
      let nextState = []
      if (CtrlOrCmdHeld(e) && selectedCommits.length > 0) {
        nextState = [_.last(selectedCommits), commit].filter(Boolean)
      } else {
        nextState = [commit]
      }
      setSelectedCommits(nextState)

      const [newCommit, oldCommit] = _.sortBy(
        nextState,
        (c) => c.dateISO,
      ).reverse()
      dispatch(diffShas(newCommit.sha, oldCommit?.sha ?? null))
    },
    [dispatch, selectedCommits],
  )

  /**
   * @type {React.MutableRefObject<FixedSizeList>}
   */
  const listRef = useRef()
  useValueEffect(headSHA, () => {
    // TODO: improve this logic to find the index asynchronously and pre-load if possible
    const index = commits.findIndex((c) => c.sha === headSHA)
    if (index >= 0) {
      setSelectedCommits([headSHA])
      listRef.current?.scrollToItem(index, 'smart')
    }
  })

  const handleReachedEndOfList = useMemo(
    () =>
      _.debounce(
        () => {
          dispatch(reachedEndOfList())
        },
        50,
        { leading: true, trailing: false },
      ),
    [dispatch],
  )

  return (
    <Wrapper>
      <Header columns={columns} />

      <VirtualList
        numberOfItems={commits.length}
        onLoadMoreItems={handleReachedEndOfList}
        listRef={listRef}>
        {({ index, style }) => (
          <Commit
            key={commits[index].sha}
            index={index}
            style={style}
            isSelected={selectedShas.includes(commits[index].sha)}
            onClick={handleSelect}
            columns={columns}
          />
        )}
      </VirtualList>
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

const VirtualList = ({ numberOfItems, onLoadMoreItems, children, listRef }) => {
  return (
    <TableWrapper>
      <AutoSizer>
        {({ width, height }) => (
          <InfiniteLoader
            isItemLoaded={(num) => num < numberOfItems}
            itemCount={numberOfItems + 100}
            loadMoreItems={onLoadMoreItems}>
            {({ onItemsRendered, ref }) => (
              <FixedSizeList
                ref={(el) => {
                  ref(el)
                  if (listRef) {
                    listRef.current = el
                  }
                }}
                width={width}
                height={height}
                itemSize={RowHeight}
                itemCount={numberOfItems}
                onItemsRendered={onItemsRendered}
                overscanCount={10}>
                {children}
              </FixedSizeList>
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    </TableWrapper>
  )
}
