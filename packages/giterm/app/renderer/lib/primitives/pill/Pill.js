import styled, { css } from 'styled-components'

import { colours } from 'app/lib/theme'

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  flex: 0;

  margin-right: ${({ marginRight }) => marginRight ?? '5px'};
`

export const Segment = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  min-width: ${({ width = 0 }) => width};

  padding-left: 3px;
  padding-right: 3px;

  border-left: solid 1px;
  border-left-color: currentColor;

  :first-child {
    border-left: none;
    border-bottom-left-radius: 5px;
    border-top-left-radius: 5px;
  }
  :last-child {
    border-bottom-right-radius: 5px;
    border-top-right-radius: 5px;
  }

  color: ${colours.PILL.FG};
  white-space: nowrap;

  background-color: ${colours.PILL.BG};
  ${({ current }) =>
    current &&
    css`
      background-color: ${colours.PILL.BG_ACTIVE};
    `};
  ${({ warning }) =>
    warning &&
    css`
      background-color: ${colours.PILL.BG_WARNING};
    `};
  ${({ error }) =>
    error &&
    css`
      background-color: ${colours.PILL.BG_ERROR};
      color: ${colours.PILL.FG_LIGHT};
    `};

  transition: 300ms ease-in-out all;
  transition-property: color, background-color;
`

export const Content = styled.div`
  padding-bottom: 2px;

  padding-left: 0.15rem;
  padding-right: 0.15rem;
`
