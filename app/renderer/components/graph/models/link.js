export class Link {
  constructor(source, target) {
    this.color = null
    this.merge = false
    this.source = source
    this.target = target
  }

  sourceSha() {
    return getSha(this.source)
  }

  targetSha() {
    return getSha(this.target)
  }
}

function getSha(node) {
  if (node && node.commit && node.commit.sha) {
    return node.commit.sha
  }
  if (node && node.id) {
    return node.id
  }
  return 'NO_SHA'
}
