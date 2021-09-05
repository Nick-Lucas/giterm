import React, { useCallback, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import { ArrowUp, ArrowDown } from 'react-feather'

import { StatusBarItem } from './StatusBarItem'
import { showRemoteBranches } from 'app/store/config/actions'
import { STATE } from '@giterm/git'
import { Pill } from 'app/lib/primitives'

function mapStateToDisplay(state) {
  switch (state) {
    case STATE.OK:
      return [{}, 'OK']
    case STATE.REBASING:
      return [{ warning: true }, 'Rebasing']
    case STATE.MERGING:
      return [{ warning: true }, 'Merging']
    case STATE.REVERTING:
      return [{ warning: true }, 'Reverting']
    case STATE.CHERRY_PICKING:
      return [{ warning: true }, 'Cherry Picking']
    case STATE.BISECTING:
      return [{ warning: true }, 'Bisecting']
    case STATE.APPLYING_MAILBOX:
      return [{ warning: true }, 'Applying Mailbox']
    case STATE.NO_REPO:
      return [{ error: true }, 'No Repository']
    default:
      return [{}, 'Loading...']
  }
}

export function StatusBar() {
  const dispatch = useDispatch()

  const { state = '' } = useSelector((state) => state.status)

  const branches = useSelector((state) => state.branches.list)
  const currentBranch = useMemo(() => {
    return branches.find((branch) => branch.isHead)
  }, [branches])

  const config = useSelector((state) => state.config)

  const toggleShowRemoteBranches = useCallback(
    (e) => {
      dispatch(
        showRemoteBranches(e?.target?.checked ?? !config.showRemoteBranches),
      )
    },
    [config.showRemoteBranches, dispatch],
  )

  const [stateProps, stateText] = useMemo(() => mapStateToDisplay(state), [
    state,
  ])

  const isAheadBehind =
    currentBranch?.upstream.ahead > 0 ||
    currentBranch?.upstream.behind > 0 ||
    false

  return (
    <Wrapper>
      <Pill.Container>
        <Pill.Segment width="6rem" {...stateProps}>
          <Pill.Content>{stateText}</Pill.Content>
        </Pill.Segment>
      </Pill.Container>

      <Pill.Container>
        {currentBranch?.upstream && (
          <Pill.Segment warning={isAheadBehind}>
            <ArrowUp size={15} />
            {currentBranch?.upstream.ahead}
            <ArrowDown size={15} />
            {currentBranch?.upstream.behind}
          </Pill.Segment>
        )}

        <Pill.Segment current={!isAheadBehind && currentBranch?.name}>
          <Pill.Content>{currentBranch?.name ?? 'No Branch'}</Pill.Content>
        </Pill.Segment>
      </Pill.Container>

      <Pill.Container
        onClick={toggleShowRemoteBranches}
        style={{ cursor: 'pointer' }}>
        <Pill.Segment>
          <ToggleInput
            type="checkbox"
            onChange={toggleShowRemoteBranches}
            checked={config.showRemoteBranches}
          />
          <StatusBarItem>Show Remote</StatusBarItem>
        </Pill.Segment>
      </Pill.Container>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  align-items: stretch;
  height: 1.5rem;

  margin: 5px;

  > * {
    margin-right: 0.5rem;
  }
`

const ToggleInput = styled.input`
  margin: 0;
  align-self: center;
  margin-top: 2px;
  margin-left: 0.25rem;
  margin-right: 0.25rem;
`
