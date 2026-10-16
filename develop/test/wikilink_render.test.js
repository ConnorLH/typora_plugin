const { test } = require("node:test")
const assert = require("node:assert/strict")
const { JSDOM } = require("jsdom")
const { decorateLinks } = require("../../plugin/wikilink/render")

test("renders wikilink labels without changing editor text", () => {
  const dom = new JSDOM(`<div id="write"><p cid="1">See [[KV Cache]] and [[folder/Note#Heading|Label]].</p><p cid="2"><code>[[code]]</code> ![[embed]]</p></div>`)
  const root = dom.window.document.querySelector("#write")
  const original = root.textContent
  decorateLinks(root)
  const links = [...root.querySelectorAll(".plu-wikilink")]
  assert.deepEqual(links.map(el => el.dataset.label), ["KV Cache", "Label"])
  assert.equal(root.textContent, original)
  decorateLinks(root)
  assert.equal(root.querySelectorAll(".plu-wikilink").length, 2)
})

test("leaves the paragraph being edited untouched", () => {
  const dom = new JSDOM(`<div id="write"><p cid="1">[[one]]</p><p cid="2">[[two]]</p></div>`)
  const root = dom.window.document.querySelector("#write")
  decorateLinks(root, "1")
  assert.equal(root.querySelectorAll(".plu-wikilink").length, 1)
  assert.equal(root.querySelector(".plu-wikilink").dataset.label, "two")
})

test("keeps theme spacing on the visible label", () => {
  const dom = new JSDOM(`<style>p { letter-spacing: 1px; word-spacing: 2px; }</style><div id="write"><p cid="1">复习 [[Long Note]] 后</p></div>`)
  const root = dom.window.document.querySelector("#write")
  decorateLinks(root)
  const link = root.querySelector(".plu-wikilink")
  assert.equal(link.style.getPropertyValue("--plu-wikilink-letter-spacing"), "1px")
  assert.equal(link.style.getPropertyValue("--plu-wikilink-word-spacing"), "2px")
  assert.equal(root.textContent, "复习 [[Long Note]] 后")
})
