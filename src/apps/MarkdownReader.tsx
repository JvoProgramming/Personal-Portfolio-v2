import { useState } from 'react'
import Markdown from 'react-markdown'
import type { MarkdownDoc } from '../content/markdown'
import { ExplorerBar } from './shared'

const STAGE_ICONS: Record<string, string> = { seedling: '🌱', budding: '🌿', evergreen: '🌳' }

/** List of Markdown posts that opens one in place, used by Work Blog and Digital Garden. */
export function MarkdownReader({ docs, path, kind }: { docs: MarkdownDoc[]; path: string; kind: 'blog' | 'garden' }) {
  const [slug, setSlug] = useState<string | null>(null)
  const doc = docs.find((d) => d.slug === slug)

  if (doc) {
    return (
      <div className="app-explorer">
        <ExplorerBar path={`${path}\\${doc.slug}.md`} onBack={() => setSlug(null)} />
        <article className="app-pad markdown">
          <h2 className="app-heading">{doc.meta.title}</h2>
          <p className="muted">
            {kind === 'garden' && doc.meta.stage ? `${STAGE_ICONS[doc.meta.stage] ?? ''} ${doc.meta.stage} · ` : ''}
            {doc.meta.company ? `${doc.meta.company} · ` : ''}
            {doc.meta.date}
          </p>
          <Markdown>{doc.body}</Markdown>
        </article>
      </div>
    )
  }

  return (
    <div className="app-explorer">
      <ExplorerBar path={path} />
      <ul className="post-list">
        {docs.map((d) => (
          <li key={d.slug}>
            <button type="button" onClick={() => setSlug(d.slug)}>
              <span aria-hidden="true">{kind === 'garden' ? (STAGE_ICONS[d.meta.stage] ?? '📝') : '📰'}</span>
              <span className="post-list__title">{d.meta.title}</span>
              <span className="post-list__date">{d.meta.date}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
