const { findLinkAt, resolveLink } = require("./links")
const { decorateLinks } = require("./render")

class WikilinkPlugin extends BasePlugin {
  style = () => true

  process = () => {
    const write = this.utils.entities.eWrite
    write.addEventListener("click", this.onClick, true)
    write.addEventListener("mousedown", this.onMouseDown, true)
    const hub = this.utils.eventHub
    hub.on(hub.eventType.fileContentLoaded, () => {
      this.editingCid = null
      this.render()
    })
    hub.on(hub.eventType.fileEdited, this.render)
    write.addEventListener("focusout", () => {
      this.editingCid = null
      setTimeout(this.render, 100)
    })
    setTimeout(this.render, 100)
  }

  render = () => {
    if (!File.editor.sourceView.inSourceMode) decorateLinks(this.utils.entities.eWrite, this.editingCid)
  }

  onMouseDown = event => {
    const target = event.target.nodeType === 1 ? event.target : event.target.parentElement
    if (!target) return
    if (event.ctrlKey || event.metaKey) return
    this.editingCid = target.closest("[cid]")?.getAttribute("cid")
    const span = target.closest(".plu-wikilink")
    if (span) span.replaceWith(document.createTextNode(span.textContent))
    else setTimeout(this.render, 100)
  }

  onClick = event => {
    if (!(event.ctrlKey || event.metaKey) || event.button !== 0) return
    if (File.editor.sourceView.inSourceMode) return
    const target = event.target.nodeType === 1 ? event.target : event.target.parentElement
    if (!target || !target.closest("#write") || target.closest("a, pre, code, .md-fences, .md-inline-code")) return
    const span = target.closest(".plu-wikilink")
    const range = span ? null : document.caretRangeFromPoint(event.clientX, event.clientY)
    const link = span
      ? findLinkAt(span.textContent, 2)
      : range && range.startContainer.nodeType === 3
        ? findLinkAt(range.startContainer.textContent, range.startOffset)
        : null
    if (!link) return

    const current = this.utils.getFilePath()
    if (!current) return
    const { Path: path, FsExtra: fs } = this.utils.Package
    const root = this.utils.getMountFolder() || path.dirname(current)
    const file = resolveLink(link.file, current, root, fs, path)
    if (!file) {
      this.utils.notification.show(this.i18n.t("fileNotFound", { file: link.file }), "warning")
      return
    }

    event.preventDefault()
    event.stopPropagation()
    if (link.heading) {
      const jump = () => {
        this.utils.eventHub.off(this.utils.eventHub.eventType.fileContentLoaded, jump)
        this.scrollToHeading(link.heading)
      }
      if (file === current) this.scrollToHeading(link.heading)
      else this.utils.eventHub.on(this.utils.eventHub.eventType.fileContentLoaded, jump)
    }
    if (file !== current) this.utils.openFile(file, true)
  }

  scrollToHeading = heading => {
    const normalize = value => value.trim().replace(/\s+/g, " ").toLowerCase()
    const match = [...this.utils.entities.eWrite.querySelectorAll("h1,h2,h3,h4,h5,h6")]
      .find(el => normalize(el.textContent) === normalize(heading))
    if (match) this.utils.scrollTo(match, { height: 20, moveCursor: true })
  }
}

module.exports = { plugin: WikilinkPlugin }
