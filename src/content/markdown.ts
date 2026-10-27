export interface MarkdownDoc {
  slug: string
  meta: Record<string, string>
  body: string
}

/** Splits a "---" frontmatter block of simple `key: value` lines from the Markdown body. */
export function parseMarkdown(slug: string, raw: string): MarkdownDoc {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
  if (!match) return { slug, meta: {}, body: raw }
  const meta: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { slug, meta, body: match[2].trim() }
}

export function loadFolder(files: Record<string, string>): MarkdownDoc[] {
  return Object.entries(files)
    .map(([path, raw]) => parseMarkdown(path.split('/').pop()!.replace(/\.md$/, ''), raw))
    .sort((a, b) => (b.meta.date ?? '').localeCompare(a.meta.date ?? ''))
}
