import { useState } from 'react'
import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import type { Finding, Project } from '@domain/project/project'
import { SEVERITIES } from '@domain/shared/severity'
import { runScan } from '../../services/scan-service'
import { useUiStore } from '../../stores/ui-store'
import { OmegaCodeSummary } from './OmegaCodeSummary'
import { OmegaFindingGroup } from './OmegaFindingGroup'
import { OmegaFindingPanel } from './OmegaFindingPanel'
import { OmegaLogList } from './OmegaLogList'
import { OmegaSection } from './OmegaSection'

interface OmegaCodeViewProps {
  readonly project: Project
  readonly findings: readonly Finding[]
  readonly log: readonly OmegaEntry[]
  readonly busy: boolean
  readonly loadSnippet: (file: string, line: number) => Promise<FileSnippet | null>
}

const BTN = 'tap rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground'

/** Scope de CODIGO: resumen del escaneo + vulnerabilidades reales por severidad. */
export function OmegaCodeView(props: OmegaCodeViewProps): React.JSX.Element {
  const { project, findings, log, busy, loadSnippet } = props
  const [sel, setSel] = useState<Finding | null>(null)
  const setView = useUiStore((s) => s.setView)
  const abiertos = findings.filter((f) => f.status === 'open')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void runScan(project.id)}
          disabled={busy}
          className="tap rounded border border-primary/50 px-2 py-1 text-xs text-primary disabled:opacity-50"
        >
          {busy ? 'Escaneando…' : 'Escanear ahora'}
        </button>
        <button type="button" className={BTN} onClick={() => setView('scan')}>
          Ver historico
        </button>
      </div>
      <OmegaSection title="Resumen del escaneo">
        <OmegaCodeSummary project={project} findings={findings} />
      </OmegaSection>
      <OmegaSection title="Vulnerabilidades por severidad">
        {abiertos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin hallazgos abiertos. Escanea el proyecto.</p>
        ) : null}
        {SEVERITIES.map((sev) => (
          <OmegaFindingGroup key={sev} severity={sev} findings={findings} onSelect={setSel} />
        ))}
      </OmegaSection>
      <OmegaSection title="Libro de la Vida — reportado vs verificado">
        <OmegaLogList entries={log} loadSnippet={loadSnippet} />
      </OmegaSection>
      {sel ? <OmegaFindingPanel finding={sel} loadSnippet={loadSnippet} onClose={() => setSel(null)} /> : null}
    </div>
  )
}
