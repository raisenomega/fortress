import type { Finding } from '@domain/project/project'
import type { Project } from '@domain/project/project'
import { EmptyState } from '../common/EmptyState'
import { FindingRow } from './FindingRow'

interface FindingsTableProps {
  readonly project: Project
  readonly findings: readonly Finding[]
}

const HEAD_CLASS = 'pb-2 text-left text-[11px] font-semibold tracking-widest uppercase'

export function FindingsTable({ project, findings }: FindingsTableProps): React.JSX.Element {
  if (findings.length === 0) {
    // Un proyecto sin escanear y uno limpio se ven igual en la tabla vacia; el
    // texto es lo unico que los distingue, asi que tiene que ser exacto.
    return project.lastScan === null ? (
      <EmptyState
        iconName="shield"
        title="Sin escanear"
        hint="Lanza un escaneo para saber que hay dentro de este proyecto."
      />
    ) : (
      <EmptyState
        iconName="check-circle"
        title="Sin hallazgos"
        hint="El ultimo escaneo de seguridad no encontro nada que reportar."
      />
    )
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border text-muted-foreground">
          <th className={HEAD_CLASS}>Sev</th>
          <th className={HEAD_CLASS}>Hallazgo</th>
          <th className={HEAD_CLASS}>Ubicacion</th>
        </tr>
      </thead>
      <tbody>
        {findings.map((finding) => (
          <FindingRow key={finding.id} finding={finding} />
        ))}
      </tbody>
    </table>
  )
}
