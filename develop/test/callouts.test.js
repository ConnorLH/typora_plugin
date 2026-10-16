const { describe, it, beforeEach } = require("node:test")
const assert = require("node:assert/strict")
require("./mocks/dom.mock.js")

global.BasePlugin = class {}
const { plugin: CalloutsPlugin } = require("../../plugin/callouts/index.js")

describe("callouts", () => {
  let plugin
  let write

  beforeEach(() => {
    write = document.querySelector("#write")
    write.innerHTML = ""
    plugin = new CalloutsPlugin()
    plugin.utils = {
      entities: {
        querySelectorAllInWrite: selector => write.querySelectorAll(selector),
        querySelectorInWrite: selector => write.querySelector(selector),
      },
      zip: (left, right) => left.map((item, index) => [item, right[index]]),
    }
  })

  it("uses custom titles for both blockquotes and native Typora alerts", () => {
    write.innerHTML = `
      <blockquote><p><span>[!abstract] 核心摘要</span><span>\n</span><span>正文</span></p></blockquote>
      <div class="md-alert md-alert-tip"><p><span>[!tip] 阅读路线</span><span>\n</span><span>正文</span></p></div>
    `

    plugin.setCallouts()

    const boxes = write.querySelectorAll(".plugin-callout")
    assert.equal(boxes.length, 2)
    assert.equal(boxes[0].getAttribute("callout-type"), "abstract")
    assert.equal(boxes[0].querySelector("p > span").getAttribute("data-type"), "核心摘要")
    assert.equal(boxes[1].getAttribute("callout-type"), "tip")
    assert.equal(boxes[1].querySelector("p > span").getAttribute("data-type"), "阅读路线")

    const exported = plugin.afterExport(`<html><body>${write.innerHTML}</body></html>`)
    const doc = new DOMParser().parseFromString(exported, "text/html")
    assert.equal(doc.querySelector(".plugin-callout[callout-type='tip'] p > span").getAttribute("data-type"), "阅读路线")
  })

  it("preserves a folded title and its display name during export", () => {
    write.innerHTML = '<blockquote><p><span>[!question]- Q：问题</span><span>\n</span><span>答案</span></p></blockquote>'
    plugin.setCallouts()

    assert.ok(write.querySelector("blockquote").classList.contains("callout-folded"))
    const exported = plugin.afterExport(`<html><body>${write.innerHTML}</body></html>`)
    const doc = new DOMParser().parseFromString(exported, "text/html")
    assert.equal(doc.querySelector("blockquote > p > span").getAttribute("data-type"), "Q：问题")
  })
})
