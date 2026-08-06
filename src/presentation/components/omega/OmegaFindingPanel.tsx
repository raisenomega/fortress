import { useEffect, useState } from 'react'
import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { Finding } from '@domain/project/project'
import { OmegaFindingLevels } from './OmegaFindingLevels'

interface OmegaFindingPanelProps {
  readonly finding: Finding
  readonly loadSnippet: (file: string, line: number) => Promise<FileSnippet | null>
  readonly onClose: () => void
}

/** Barra lateral de una vulnerabilidad con niveles. OMEGA la VERIFICA contra el
 *  disco: si el archivo:linea no existe, lo marca como posible falso positivo. */
export function OmegaFindingPanel(props: OmegaFindingPanelProps): React.JSX.Element {
  const { finding, loadSnippet, onClose } = props
  const [snippet, setSnippet] = useState<FileSnippet | null>(null)
  const loc = finding.line !== null ? `${finding.file}:${finding.line}` : finding.file

  useEffect(() => {
    let live = true
    if (finding.file && finding.line !== null) {
      void loadSnippet(finding.file, finding.line).then((s) => live && setSnippet(s))
    }
    return () => {
      live = false
    }
  }, [finding.file, finding.line, loadSnippet])

  return (
    <aside className="fixed top-12 right-0 bottom-7 z-30 w-96 space-y-3 overflow-y-auto border-l border-border bg-sidebar p-4 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-critical uppercase">{finding.severity}</span>
        <button
          type="button"
          onClick={onClose}
          className="tap ml-auto text-xs text-muted-foreground"
        >
          Cerrar
        </button>
      </div>
      <OmegaFindingLevels finding={finding} snippet={snippet} loc={loc} />
    </aside>
  )
}
