import type { FileSnippet } from '@domain/omega/filesystem-probe'

interface OmegaEvidenceProps {
  readonly snippet: FileSnippet
}

/** El codigo REAL alrededor de la linea citada. La evidencia que OMEGA no inventa. */
export function OmegaEvidence({ snippet }: OmegaEvidenceProps): React.JSX.Element {
  if (!snippet.found) {
    return <p className="mt-1 text-[11px] text-critical">El archivo no existe en el disco.</p>
  }

  return (
    <pre className="mt-1 overflow-x-auto rounded border border-border bg-secondary/30 p-2 text-[11px] text-muted-foreground">
      {snippet.lines.map((row) => (
        <div key={row.n}>
          <span className="mr-2 select-none text-muted-foreground/60">{row.n}</span>
          {row.text}
        </div>
      ))}
    </pre>
  )
}
