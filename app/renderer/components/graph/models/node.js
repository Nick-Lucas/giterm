import { Color } from './color'

export class Node {
  constructor(id) {
    this.id = id

    this.commit = null
    this.x = null
    this.y = null
    this.color = null
    this.secondColor = null

    this.processed = false
    this.x_order = 0
  }
}
