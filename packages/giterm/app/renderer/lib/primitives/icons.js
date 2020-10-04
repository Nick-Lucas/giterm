import React from 'react'

import { colours } from 'app/lib/theme'

export function FileDiff({ size = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: size,
        height: size,
      }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <line
        x1="10.343"
        y1="18.327"
        x2="10.343"
        y2="12.327"
        stroke={colours.TEXT.POSITIVE}
      />
      <line
        x1="7.343"
        y1="15.327"
        x2="13.343"
        y2="15.327"
        stroke={colours.TEXT.POSITIVE}
      />
      <line
        x1="7.343"
        y1="7.529"
        x2="13.343"
        y2="7.529"
        stroke={colours.TEXT.NEGATIVE}
      />
    </svg>
  )
}
