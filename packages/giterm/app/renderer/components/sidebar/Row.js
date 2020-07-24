import styled from 'styled-components'
import { colours } from 'app/lib/theme'

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0.25rem 0.5rem;

  :hover {
    background-color: ${colours.OVERLAY.HINT};
  }

  max-width: 100%;

  font-weight: ${({ active }) => (active ? 'bold' : 'inherit')};
  color: ${({ active }) => (active ? colours.TEXT.FOCUS : 'inherit')};
`

export const Label = styled.div`
  flex: 1;

  color: ${({ colour }) => colour || 'inherit'};

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: ${({ trimStart }) => (trimStart ? 'rtl' : 'inherit')};
  text-align: left;
`
