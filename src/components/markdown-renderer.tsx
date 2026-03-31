'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\wа-яіїєґё\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const components: Components = {
  h1: ({ children }) => {
    const text = String(children)
    return <h1 id={slugify(text)}>{children}</h1>
  },
  h2: ({ children }) => {
    const text = String(children)
    return <h2 id={slugify(text)}>{children}</h2>
  },
  h3: ({ children }) => {
    const text = String(children)
    return <h3 id={slugify(text)}>{children}</h3>
  },
  h4: ({ children }) => {
    const text = String(children)
    return <h4 id={slugify(text)}>{children}</h4>
  },
}

export function MarkdownRenderer({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="text-sm text-muted-foreground/50 italic">Немає опису</p>
    )
  }

  return (
    <div className="prose-custom">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

/** Extract headings from markdown for TOC */
export function extractHeadings(markdown: string) {
  const headings: { level: number; text: string; id: string }[] = []
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{1,4})\s+(.+)$/)
    if (match) {
      const text = match[2].replace(/[*_`]/g, '').trim()
      headings.push({ level: match[1].length, text, id: slugify(text) })
    }
  }
  return headings
}
