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
`

export const Label = styled.div`
  flex: 1;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`
