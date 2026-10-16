const findLinkAt = (text, offset) => {
  const pattern = /(?<!!)\[\[([^\[\]\r\n]+)\]\]/g
  let match
  while ((match = pattern.exec(text))) {
    if (offset >= match.index && offset < match.index + match[0].length) {
      return parseLink(match[1])
    }
  }
  return null
}

const parseLink = content => {
  const [target] = content.split("|", 1)
  const hash = target.indexOf("#")
  const file = (hash < 0 ? target : target.slice(0, hash)).trim()
  const heading = hash < 0 ? "" : target.slice(hash + 1).trim()
  return file || heading ? { file, heading } : null
}

const resolveLink = (file, currentFile, root, fs, path) => {
  if (!file) return currentFile
  const name = /\.md$/i.test(file) ? file : file + ".md"
  const withinRoot = candidate => {
    const relative = path.relative(root, candidate)
    return relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative)
  }
  const local = path.resolve(path.dirname(currentFile), name)
  const rooted = path.resolve(root, name)
  for (const candidate of [local, rooted]) {
    if (withinRoot(candidate) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  if (/[\\/]/.test(file)) return null

  const matches = []
  const pending = [root]
  while (pending.length) {
    const dir = pending.pop()
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch (_) { continue }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue
      const candidate = path.join(dir, entry.name)
      if (entry.isDirectory()) pending.push(candidate)
      else if (entry.isFile() && entry.name.toLowerCase() === name.toLowerCase()) matches.push(candidate)
    }
  }
  matches.sort((a, b) => a.length - b.length || a.localeCompare(b))
  return matches[0] || null
}

module.exports = { findLinkAt, parseLink, resolveLink }
