import { useEffect, useState } from 'react'
import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import { OmegaEvidence } from './OmegaEvidence'
import { OmegaLevel } from './OmegaLevel'

const LOC = /^(.+):(\d+)$/

interface OmegaDiscrepancyPanelProps {
  readonly entry: OmegaEntry
  readonly loadSnippet: (file: string, line: number) => Promise<FileSnippet | null>
  readonly onClose: () => void
}

/** Barra lateral de una discrepancia con sus niveles reales (incl. filesystem). */
export function OmegaDiscrepancyPanel(props: OmegaDiscrepancyPanelProps): React.JSX.Element {
  const { entry, loadSnippet, onClose } = props
  const [snippet, setSnippet] = useState<FileSnippet | null>(null)
  const match = LOC.exec(entry.evidence)

  useEffect(() => {
    let live = true
    if (match) void loadSnippet(match[1], Number(match[2])).then((s) => live && setSnippet(s))
    return () => {
      live = false
    }
  }, [entry.evidence])

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-96 space-y-3 overflow-y-auto border-l border-border bg-sidebar p-4 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-critical uppercase">Discrepancia</span>
        <button type="button" onClick={onClose} className="tap ml-auto text-xs text-muted-foreground">
          Cerrar
        </button>
      </div>
      <OmegaLevel n={1} title="Resumen">{entry.summary}</OmegaLevel>
      <OmegaLevel n={2} title="Evidencia citada">
        <span className="font-mono">{entry.evidence || 's/d'}</span>
      </OmegaLevel>
      <OmegaLevel n={3} title="Evidencia en filesystem">
        {match ? (snippet ? <OmegaEvidence snippet={snippet} /> : 'Cargando…') : 'Sin archivo:linea'}
      </OmegaLevel>
      <OmegaLevel n={4} title="Veredicto de OMEGA">
        Lo reportado no cuadra con el disco. Sin juicio de intencion: solo lo verificable.
      </OmegaLevel>
    </aside>
  )
}
