import { useState } from 'react'
import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import { OmegaEvidence } from './OmegaEvidence'

const TONE: Record<string, string> = {
  ok: 'text-success',
  discrepancia: 'text-critical',
  veto: 'text-critical',
  info: 'text-muted-foreground'
}

/** Un asiento con evidencia archivo:linea (una sola), para pedir el codigo real. */
const LOC = /^(.+):(\d+)$/

interface OmegaEntryRowProps {
  readonly entry: OmegaEntry
  readonly loadSnippet: (file: string, line: number) => Promise<FileSnippet | null>
}

export function OmegaEntryRow({ entry, loadSnippet }: OmegaEntryRowProps): React.JSX.Element {
  const [snippet, setSnippet] = useState<FileSnippet | null>(null)
  const match = LOC.exec(entry.evidence)

  return (
    <li className="rounded-md border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold uppercase ${TONE[entry.verdict] ?? ''}`}>
          {entry.verdict}
        </span>
        <span className="truncate text-xs text-foreground">{entry.summary}</span>
      </div>
      {entry.evidence ? (
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{entry.evidence}</p>
      ) : null}
      {match ? (
        <button
          type="button"
          onClick={() => void loadSnippet(match[1], Number(match[2])).then(setSnippet)}
          className="tap mt-1 text-[10px] tracking-wide text-primary uppercase"
        >
          Ver evidencia
        </button>
      ) : null}
      {snippet ? <OmegaEvidence snippet={snippet} /> : null}
    </li>
  )
}
