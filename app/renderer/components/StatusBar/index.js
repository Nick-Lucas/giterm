import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled, { css } from 'styled-components'

import { ArrowUp, ArrowDown } from 'react-feather'
import { showRemoteBranches } from '../../store/config/actions'

export function StatusBar() {
  const dispatch = useDispatch()

  const {
    state = '',
    current = '',
    ahead = 0,
    behind = 0,
    files = [],
    staged = [],
  } = useSelector((state) => state.status)

  const config = useSelector((state) => state.config)

  const toggleShowRemoteBranches = useCallback(() => {
    dispatch(showRemoteBranches(!showRemoteBranches))
  }, [])

  return (
    <Wrapper>
      <Group width={250}>
        <Item>Status: {state}</Item>
        <Item>
          {staged.length}/{files.length}
        </Item>
      </Group>

      <Group width={300}>
        <Item>Branch: {current}</Item>
        <Item>
          <ArrowUp size={15} />
          {ahead}
          <ArrowDown size={15} />
          {behind}
        </Item>
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
