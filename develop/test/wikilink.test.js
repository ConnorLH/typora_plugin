const { test } = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const { findLinkAt, resolveLink } = require("../../plugin/wikilink/links")

test("finds the wikilink under the pointer and parses alias and heading", () => {
  const text = "See [[folder/Note#A Heading|label]] and [[#Local]]"
  assert.deepEqual(findLinkAt(text, text.indexOf("label")), { file: "folder/Note", heading: "A Heading" })
  assert.deepEqual(findLinkAt(text, text.indexOf("Local")), { file: "", heading: "Local" })
  assert.equal(findLinkAt("![[embed]]", 5), null)
  assert.equal(findLinkAt("[[ ]]", 3), null)
})

test("resolves local, vault-relative and basename links", () => {
  const files = new Set(["C:\\vault\\folder\\Note.md", "C:\\vault\\other\\Target.md"])
  const directories = {
    "C:\\vault": [{ name: "folder", isDirectory: () => true, isFile: () => false }, { name: "other", isDirectory: () => true, isFile: () => false }],
    "C:\\vault\\folder": [{ name: "Note.md", isDirectory: () => false, isFile: () => true }],
    "C:\\vault\\other": [{ name: "Target.md", isDirectory: () => false, isFile: () => true }],
  }
  const fs = {
    existsSync: file => files.has(file),
    statSync: () => ({ isFile: () => true }),
    readdirSync: dir => directories[dir] || [],
  }
  const current = "C:\\vault\\folder\\Current.md"
  const root = "C:\\vault"
  assert.equal(resolveLink("Note", current, root, fs, path.win32), "C:\\vault\\folder\\Note.md")
  assert.equal(resolveLink("other/Target", current, root, fs, path.win32), "C:\\vault\\other\\Target.md")
  assert.equal(resolveLink("Target", current, root, fs, path.win32), "C:\\vault\\other\\Target.md")
  assert.equal(resolveLink("Missing", current, root, fs, path.win32), null)
  assert.equal(resolveLink("../../outside", current, root, fs, path.win32), null)
  assert.equal(resolveLink("", current, root, fs, path.win32), current)
})
