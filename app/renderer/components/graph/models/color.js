export class Color {
  static parseHex(inString) {
    const color = new Color(0, 0, 0)
    color.setHex(inString)
    return color
  }

  constructor(r, g, b) {
    this.r = r
    this.g = g
    this.b = b
  }

  setHex(value) {
    const parsed = value.split('#')
    if (parsed.length > 1 && parsed[1].length === 6) {
      const segment1 = parsed[1].substring(0, 2)
      const segment2 = parsed[1].substring(2, 4)
      const segment3 = parsed[1].substring(4, 6)
      this.r = parseInt(segment1, 16)
      this.g = parseInt(segment2, 16)
      this.b = parseInt(segment3, 16)
    }
  }

  stringValue() {
    return `rgba(${this.r},${this.g},${this.b},1)`
  }
}
