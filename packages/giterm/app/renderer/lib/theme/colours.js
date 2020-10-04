import Color from 'color'

export function alpha(hex, amount = 0) {
  return Color(hex, 'hex')
    .alpha(amount)
    .toString()
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
  DEFAULT: 'rgba(255, 255, 255, 0.8)',
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
  FG: 'rgba(0, 0, 0, 0.5)',
}
