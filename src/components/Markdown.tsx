import type { ReactNode } from 'react'

// A very small Markdown renderer for the assistant's answers.
// Supports: paragraphs, **bold**, bullet lists (- or *) and numbered lists (1.).
// Lists use ps-5 (padding at the "start"), so bullets sit on the right in Arabic.

function bold(line: string): ReactNode[] {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  )
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const closeList = () => {
    if (!list) return
    const items = list.items.map((item, i) => <li key={i}>{bold(item)}</li>)
    blocks.push(
      list.ordered ? (
        <ol key={blocks.length} className="list-decimal space-y-1 ps-5">{items}</ol>
      ) : (
        <ul key={blocks.length} className="list-disc space-y-1 ps-5">{items}</ul>
      ),
    )
    list = null
  }

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const bullet = line.match(/^[-*•]\s+(.*)/)
    const numbered = line.match(/^\d+[.)]\s+(.*)/)

    if (bullet || numbered) {
      const ordered = Boolean(numbered)
      if (!list || list.ordered !== ordered) {
        closeList()
        list = { ordered, items: [] }
      }
      list.items.push((bullet ?? numbered)![1])
    } else {
      closeList()
      if (line) {
        const heading = line.replace(/^#+\s*/, '')
        blocks.push(
          <p key={blocks.length} className={line.startsWith('#') ? 'font-bold' : undefined}>
            {bold(heading)}
          </p>,
        )
      }
    }
  }
  closeList()

  return <div className="space-y-2">{blocks}</div>
}
