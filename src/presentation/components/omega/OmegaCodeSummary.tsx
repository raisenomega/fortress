import type { Finding, Project } from '@domain/project/project'
import { countFindings, totalFindings } from '@domain/project/severity-counts'
import { OmegaFieldGrid, type Field } from './OmegaFieldGrid'

interface OmegaCodeSummaryProps {
  readonly project: Project
  readonly findings: readonly Finding[]
}

/** Resumen del escaneo con datos REALES. Lo que el escaner no persiste (LOC,
 *  deuda, complejidad) va 's/d': no se inventa una cifra. */
export function OmegaCodeSummary({ project, findings }: OmegaCodeSummaryProps): React.JSX.Element {
  const c = countFindings(findings.filter((f) => f.status === 'open'))
  const fields: readonly Field[] = [
    { label: 'Ultimo escaneo', value: project.lastScan ? project.lastScan.slice(0, 10) : 's/d' },
    { label: 'Vulnerabilidades', value: String(totalFindings(c)) },
    { label: 'Calidad (score)', value: `${project.fortressScore}%` },
    { label: 'Criticas', value: String(c.CRITICAL) },
    { label: 'Altas', value: String(c.HIGH) },
    { label: 'Medias', value: String(c.MEDIUM) },
    { label: 'Bajas', value: String(c.LOW) },
    { label: 'LOC / deuda / complejidad', value: 's/d' }
  ]

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <OmegaFieldGrid fields={fields} />
    </div>
  )
}
