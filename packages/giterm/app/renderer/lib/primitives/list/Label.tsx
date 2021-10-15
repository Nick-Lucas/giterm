import styled from 'styled-components'

export interface LabelProps {
  colour?: string
  trimStart?: boolean
  textAlign?: 'left' | 'right' | 'center' | 'justify' | 'match-parent'
}

export const Label = styled.div<LabelProps>`
  flex: 1;

  color: ${({ colour }) => colour || 'inherit'};

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: ${({ trimStart }) => (trimStart ? 'rtl' : 'inherit')};
  text-align: ${({ textAlign = 'left' }) => textAlign};
`
