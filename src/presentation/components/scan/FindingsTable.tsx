import type { Finding } from '@domain/project/project'
import type { Project } from '@domain/project/project'
import { FindingRow } from './FindingRow'
import { FindingsEmpty } from './FindingsEmpty'

interface FindingsTableProps {
  readonly project: Project
  readonly findings: readonly Finding[]
  readonly onDismiss: (id: string) => void
  readonly onReopen: (id: string) => void
  readonly onMitigate: (id: string, nota: string) => void
  readonly onUnmitigate: (id: string) => void
}

const HEAD_CLASS = 'pb-2 text-left text-[11px] font-semibold tracking-widest uppercase'

export function FindingsTable({
  project,
  findings,
  onDismiss,
  onReopen,
  onMitigate,
  onUnmitigate
}: FindingsTableProps): React.JSX.Element {
  if (findings.length === 0) return <FindingsEmpty project={project} />

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border text-muted-foreground">
          <th className={HEAD_CLASS}>Sev</th>
          <th className={HEAD_CLASS}>Hallazgo</th>
          <th className={HEAD_CLASS}>Ubicacion</th>
          <th className={HEAD_CLASS} />
        </tr>
      </thead>
      <tbody>
        {findings.map((finding) => (
          <FindingRow
            key={finding.id}
            finding={finding}
            onDismiss={onDismiss}
            onReopen={onReopen}
            onMitigate={onMitigate}
            onUnmitigate={onUnmitigate}
          />
        ))}
      </tbody>
    </table>
  )
}
