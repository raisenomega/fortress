import { useEffect, useState } from 'react'
import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import { OmegaEvidence } from './OmegaEvidence'
import { OmegaFileHistory } from './OmegaFileHistory'
import { OmegaLevel } from './OmegaLevel'

const LOC = /^(.+):(\d+)$/

interface OmegaDiscrepancyPanelProps {
  readonly entry: OmegaEntry
  readonly log: readonly OmegaEntry[]
  readonly loadSnippet: (file: string, line: number) => Promise<FileSnippet | null>
  readonly onClose: () => void
}

/** Barra lateral de una discrepancia con sus niveles. Datos reales; lo que OMEGA
 *  no mide (impacto exacto, CVE, dependencias) se dice honesto, no se inventa. */
export function OmegaDiscrepancyPanel(props: OmegaDiscrepancyPanelProps): React.JSX.Element {
  const { entry, log, loadSnippet, onClose } = props
  const [snippet, setSnippet] = useState<FileSnippet | null>(null)
  const match = LOC.exec(entry.evidence)
  const file = entry.evidence.split(':')[0]

  useEffect(() => {
    let live = true
    if (match) void loadSnippet(match[1], Number(match[2])).then((s) => live && setSnippet(s))
    return () => {
      live = false
    }
  }, [entry.evidence])

  return (
    <aside className="fixed top-12 right-0 bottom-7 z-30 w-96 space-y-3 overflow-y-auto border-l border-border bg-sidebar p-4 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-critical uppercase">Discrepancia</span>
        <button type="button" onClick={onClose} className="tap ml-auto text-xs text-muted-foreground">
          Cerrar
        </button>
      </div>
      <OmegaLevel n={1} title="Resumen">{entry.summary}</OmegaLevel>
      <OmegaLevel n={2} title="Evidencia en el archivo">
        {match ? snippet ? <OmegaEvidence snippet={snippet} /> : 'Cargando…' : 'Sin archivo:linea'}
      </OmegaLevel>
      <OmegaLevel n={3} title="Analisis de impacto">
        El reporte de este agente NO cuadra con el disco: no es fiable en este punto.
      </OmegaLevel>
      <OmegaLevel n={4} title="Historico de este archivo">
        <OmegaFileHistory entries={log} file={file} excludeId={entry.id} />
      </OmegaLevel>
      <OmegaLevel n={5} title="Analisis de dependencias / CVE">
        Fuera del alcance de OMEGA: no analiza dependencias ni CVE, no los inventa.
      </OmegaLevel>
      <OmegaLevel n={6} title="Veredicto">
        No cuadra con el disco. Sin juicio de intencion; solo lo verificable.
      </OmegaLevel>
    </aside>
  )
}
