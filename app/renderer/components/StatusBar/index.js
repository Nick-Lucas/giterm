import React, { useCallback, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled, { css } from 'styled-components'

import { ArrowUp, ArrowDown } from 'react-feather'
import { showRemoteBranches } from '../../store/config/actions'

export function StatusBar() {
  const dispatch = useDispatch()

  const { state = '', files = [], staged = [] } = useSelector(
    (state) => state.status,
  )

  const branches = useSelector((state) => state.branches)
  const currentBranch = useMemo(
    () => {
      return branches.find((branch) => branch.isHead)
    },
    [branches],
  )

  const config = useSelector((state) => state.config)

  const toggleShowRemoteBranches = useCallback(
    () => {
      dispatch(showRemoteBranches(!showRemoteBranches))
    },
    [dispatch],
  )

  return (
    <Wrapper>
      <Group width={250}>
        <Item>Status: {state}</Item>
        <Item>
          {staged.length}/{files.length}
        </Item>
      </Group>

      <Group width={300}>
        {currentBranch && (
          <>
            <Item>Branch: {currentBranch.name}</Item>
            {currentBranch.upstream && (
              <Item>
                <ArrowUp size={15} />
                {currentBranch.upstream.ahead}
                <ArrowDown size={15} />
                {currentBranch.upstream.behind}
              </Item>
            )}
          </>
        )}
      </Group>

      <Group>
        <Item>Show Remote</Item>
        <ToggleInput
          type="checkbox"
          onChange={toggleShowRemoteBranches}
          checked={config.showRemoteBranches}
        />
      </Group>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  margin: 5px;
`

const Group = styled.div`
  display: flex;
  margin-right: 5px;

  ${(props) =>
    props.width &&
    css`
      min-width: ${props.width}px;
      max-width: ${props.width}px;
    `};
`

const Item = styled.div`
  display: flex;
  margin-right: 5px;
  align-items: center;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  ${(props) =>
    props.width &&
    css`
      min-width: ${props.width}px;
      max-width: ${props.width}px;
    `};
`

const ToggleInput = styled.input`
  margin: 0;
  align-self: flex-end;
  margin-bottom: 1px;
`
