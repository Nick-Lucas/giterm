import styled from 'styled-components'

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0.25rem 0.5rem;

  :hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  max-width: 100%;

  font-weight: ${({ active }) => (active ? 'bold' : 'inherit')};
  color: ${({ active }) => (active ? 'rgba(255, 255, 255, 1)' : 'inherit')};
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
