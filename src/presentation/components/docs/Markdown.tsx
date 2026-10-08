import { sinFenceExterior, splitBlocks, type MdBlock } from './markdown-blocks'
import { renderInline } from './markdown-inline'
import { MarkdownTable } from './MarkdownTable'

const HEADING = [
  'text-base font-semibold',
  'text-sm font-semibold',
  'text-xs font-semibold uppercase'
]
const CODE = 'overflow-x-auto rounded bg-secondary/40 p-2 font-mono text-[11px] whitespace-pre-wrap'

function renderBlock(block: MdBlock, key: number): React.JSX.Element {
  if (block.type === 'code') {
    return (
      <pre key={key} className={CODE}>
        {block.lines.join('\n')}
      </pre>
    )
  }
  if (block.type === 'heading') {
    // Nivel 4+ (la dieta del chat) cae al estilo mas chico: nunca crudo.
    const estilo = HEADING[Math.min(block.level ?? 1, 3) - 1]
    return (
      <p key={key} className={`mt-3 text-foreground ${estilo}`}>
        {renderInline(block.lines[0])}
      </p>
    )
  }
  if (block.type === 'table') {
    return <MarkdownTable key={key} filas={block.lines} />
  }
  if (block.type === 'list') {
    return (
      <ul key={key} className="ml-4 list-disc space-y-0.5">
        {block.lines.map((line, i) => (
          <li key={i}>{renderInline(line)}</li>
        ))}
      </ul>
    )
  }
  return (
    <p key={key} className="mt-1">
      {renderInline(block.lines[0])}
    </p>
  )
}

interface MarkdownProps {
  readonly text: string
  /** El tono lo pone quien pinta: docs usa el suyo; el chat, el de su vista. */
  readonly className?: string
}

/** Render minimo y SEGURO de Markdown (sin libs, sin HTML). */
export function Markdown({ text, className }: MarkdownProps): React.JSX.Element {
  return (
    <div className={className ?? 'space-y-1 text-xs text-muted-foreground'}>
      {splitBlocks(sinFenceExterior(text)).map(renderBlock)}
    </div>
  )
}
