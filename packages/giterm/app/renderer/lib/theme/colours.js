import Color from 'color'

export function darken(hex, amount = 0) {
  return Color(hex, 'hex').darken(amount).hex()
}
export function lighten(hex, amount = 0) {
  return Color(hex, 'hex').lighten(amount).hex()
}

export function alpha(hex, amount = 0) {
  return Color(hex, 'hex').alpha(amount).hex()
}

export const palette = {
  bg: '#001825',
  bg2: lighten('#001825', 0.2),
}

export const GRAPH_NODES = [
  '#058ED9',
  '#880044',
  '#875053',
  '#129490',
  '#E5A823',
  '#0055A2',
  '#96C5F7',
]

export const BACKGROUND = {
  POSITIVE: alpha('#149490', 0.65),
  NEGATIVE: alpha('#A60053', 0.65),
  ACTION: alpha('#0086FF', 0.65),
  FOCUS: alpha('#0086FF', 0.1),
}

export const TEXT = {
  FOCUS: '#fff',
  DEFAULT: Color('rgba(230, 230, 230)', 'rgb').hex(),
  POSITIVE: '#149490',
  NEGATIVE: '#A60053',
  ACTION: '#0086FF',
  WARNING: '#E5A823',
}

export const OVERLAY = {
  FOCUS: 'rgba(255, 255, 255, 0.2)',
  HINT: 'rgba(255, 255, 255, 0.3)',
}

export const PILL = {
  BG: 'rgba(255, 255, 255, 0.6)',
  BG_ACTIVE: 'rgba(200, 255, 200, 0.8)',
  BG_WARNING: '#E5A823',
  BG_ERROR: '#A60053',
  FG: 'rgba(0, 0, 0, 0.75)',
  FG_LIGHT: TEXT.DEFAULT,
}

export const EDITOR = {
  bg: palette.bg2,
  white: TEXT.DEFAULT,
  dim: darken(TEXT.DEFAULT, 0.3),
  blue: '#058ED9',
  red: '#880044',
  brown: lighten('#875053', 0.5),
  green: lighten('#129490', 0.3),
  yellow: '#E5A823',
  blue2: '#0055A2',
  blue3: '#96C5F7',
}
