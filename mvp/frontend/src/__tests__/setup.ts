const emptyRect = (): DOMRect => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  toJSON() {
    return this
  },
})

if (typeof Range !== 'undefined') {
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = function (): DOMRectList {
      return { length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] } as unknown as DOMRectList
    }
  }
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = function (): DOMRect {
      return emptyRect()
    }
  }
}

if (typeof Element !== 'undefined' && !Element.prototype.getBoundingClientRect) {
  Element.prototype.getBoundingClientRect = function (): DOMRect {
    return emptyRect()
  }
}
