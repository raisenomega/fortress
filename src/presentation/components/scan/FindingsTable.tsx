import type { Finding } from '@domain/project/project'
import type { Project } from '@domain/project/project'
import { CajitaDeSeleccion } from './CajitaDeSeleccion'
import { FindingRow } from './FindingRow'
import { FindingsEmpty } from './FindingsEmpty'

interface FindingsTableProps {
  readonly project: Project
  readonly findings: readonly Finding[]
  readonly onDismiss: (id: string) => void
  readonly onReopen: (id: string) => void
  readonly onMitigate: (id: string, nota: string) => void
  readonly onUnmitigate: (id: string) => void
  readonly onRepair: (id: string) => void
  readonly onResolver: (id: string) => void
  readonly onVerificar: (id: string) => void
  readonly ocupado: boolean
  readonly seleccion: ReadonlySet<string>
  readonly onSeleccionar: (id: string) => void
  /** Los verificables de la VISTA. De aqui sale la cajita de la cabecera. */
  readonly visibles: readonly string[]
  readonly onTodasLasVisibles: () => void
  /** Hay hallazgos, pero ninguno pasa el filtro. No es lo mismo que no haberlos. */
  readonly filtrando: boolean
  readonly onQuitarFiltro: () => void
}

const HEAD_CLASS = 'pb-2 text-left text-[11px] font-semibold tracking-widest uppercase'

export function FindingsTable(props: FindingsTableProps): React.JSX.Element {
  const { project, findings, seleccion, visibles } = props
  if (findings.length === 0) {
    return <FindingsEmpty project={project} filtrando={props.filtrando} onQuitar={props.onQuitarFiltro} /> // prettier-ignore
  }

  const todas = visibles.length > 0 && visibles.every((id) => seleccion.has(id))
  const algunas = visibles.some((id) => seleccion.has(id))

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border text-muted-foreground">
          <th className={HEAD_CLASS}>
            {visibles.length > 0 ? (
              <CajitaDeSeleccion
                marcada={todas}
                aMedias={algunas}
                titulo={`Seleccionar ${visibles.length} verificables de esta vista`}
                onToggle={props.onTodasLasVisibles}
              />
            ) : null}
          </th>
          <th className={HEAD_CLASS}>Sev</th>
          <th className={HEAD_CLASS}>Hallazgo</th>
          <th className={HEAD_CLASS}>Ubicacion</th>
          <th className={HEAD_CLASS} />
        </tr>
      </thead>
      <tbody>
        {findings.map((finding) => (
          <FindingRow
            {...props}
            key={finding.id}
            finding={finding}
            seleccionada={seleccion.has(finding.id)}
          />
        ))}
      </tbody>
    </table>
  )
}
