import styled from 'styled-components'
import { colours } from 'app/lib/theme'

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0.25rem 0.5rem;

  background-color: ${({ active }) =>
    active ? colours.OVERLAY.FOCUS : 'transparent'};
  :hover {
    background-color: ${colours.OVERLAY.HINT};
  }

  max-width: 100%;

  font-weight: ${({ active }) => (active ? 'bold' : 'inherit')};
  color: ${({ active }) => (active ? colours.TEXT.FOCUS : 'inherit')};
`
