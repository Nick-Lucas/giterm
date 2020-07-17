import React, { useCallback, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled, { css } from 'styled-components'
import { ArrowUp, ArrowDown } from 'react-feather'

import { StatusBarItem } from './StatusBarItem'
import { showRemoteBranches } from '../../store/config/actions'
import { STATE } from '../../lib/git'

function mapStateToDisplay(state) {
  switch (state) {
    case STATE.OK:
      return ['white', 'OK']
    case STATE.REBASING:
      return ['white', 'Rebasing']
    case STATE.MERGING:
      return ['white', 'Merging']
    case STATE.REVERTING:
      return ['white', 'Reverting']
    case STATE.CHERRY_PICKING:
      return ['white', 'Cherry Picking']
    case STATE.BISECTING:
      return ['white', 'Bisecting']
    case STATE.APPLYING_MAILBOX:
      return ['white', 'Applying Mailbox']
    case STATE.NO_REPO:
      return ['white', 'No Repository']
    default:
      return [null, '']
  }
}

export function StatusBar() {
  const dispatch = useDispatch()

  const { state = '' } = useSelector((state) => state.status)

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

  const [stateColour, stateText] = useMemo(() => mapStateToDisplay(state), [
    state,
  ])

  return (
    <Wrapper>
      <Group width={250}>
        <StatusBarItem title="Status:" colour={stateColour}>
          {stateText}
        </StatusBarItem>
      </Group>

      <Group width={300}>
        {currentBranch && (
          <>
            <StatusBarItem title="Branch:">{currentBranch.name}</StatusBarItem>

            {currentBranch.upstream && (
              <StatusBarItem>
                <ArrowUp size={15} />
                {currentBranch.upstream.ahead}
                <ArrowDown size={15} />
                {currentBranch.upstream.behind}
              </StatusBarItem>
            )}
          </>
        )}
      </Group>

      <Group>
        <StatusBarItem>Show Remote</StatusBarItem>
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

const ToggleInput = styled.input`
  margin: 0;
  align-self: flex-end;
  margin-bottom: 1px;
`
