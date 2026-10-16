const { parseLink } = require("./links")

const WIKILINK = /(?<!!)\[\[([^\[\]\r\n]+)\]\]/g
const SKIP = "a, code, pre, [md-inline=code], .md-fences, .plu-wikilink"

const decorateText = (node, doc) => {
  const text = node.textContent
  let match
  let cursor = 0
  let changed = false
  const fragment = doc.createDocumentFragment()
  WIKILINK.lastIndex = 0
  while ((match = WIKILINK.exec(text))) {
    const link = parseLink(match[1])
    if (!link) continue
    const alias = match[1].split("|").slice(1).join("|").trim()
    const label = alias || link.file.split(/[\\/]/).pop() || link.heading
    fragment.appendChild(doc.createTextNode(text.slice(cursor, match.index)))
    const span = doc.createElement("span")
    span.className = "plu-wikilink"
    span.dataset.wikilink = match[1]
    span.dataset.label = label
    const style = doc.defaultView.getComputedStyle(node.parentElement)
    span.style.setProperty("--plu-wikilink-size", style.fontSize)
    span.style.setProperty("--plu-wikilink-letter-spacing", style.letterSpacing)
    span.style.setProperty("--plu-wikilink-word-spacing", style.wordSpacing)
    span.textContent = match[0]
    fragment.appendChild(span)
    cursor = match.index + match[0].length
    changed = true
  }
  if (changed) {
    fragment.appendChild(doc.createTextNode(text.slice(cursor)))
    node.parentNode.replaceChild(fragment, node)
  }
  return changed
}

const decorateLinks = (root, editingCid) => {
  const doc = root.ownerDocument
  const walker = doc.createTreeWalker(root, doc.defaultView.NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    const parent = node.parentElement
    const block = parent && parent.closest("[cid]")
    if (block && block.getAttribute("cid") !== editingCid && !parent.closest(SKIP) && node.textContent.includes("[[")) nodes.push(node)
  }
  nodes.forEach(node => decorateText(node, doc))
}

module.exports = { decorateLinks }
