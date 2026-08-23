import type { Project } from '@domain/project/project'
import { useActiveProject } from '../../stores/project-store'
import { useRepairStore } from '../../stores/repair-store'
import { useRepairFeed } from '../../hooks/useRepairFeed'
import { usePaginado } from '../../hooks/usePaginado'
import { colaDeFirma } from './cola-de-firma'
import { Paginador } from './Paginador'
import { RepairProposalRow } from './RepairProposalRow'

const subtitulo = (project: Project | null): string =>
  project === null
    ? 'Selecciona un proyecto para ver lo que espera tu firma.'
    : `Propuestas de ${project.name} que ya pasaron el gate. Firmar es lo unico que integra.`

/**
 * La cola de firma en su propia pagina, una fila por propuesta.
 *
 * Era un rectangulo con un solo boton que firmaba siempre la cabeza, y debajo
 * filas de texto que no se podian ni abrir ni firmar: para saber que decia un
 * fix habia que ir a buscarlo al expediente del motor, y para firmar el tercero
 * habia que firmar antes los dos de arriba. Ahora cada fila es la MISMA del
 * motor —chevron, razon del analisis, libro de vida al desplegar— con su propio
 * boton, asi que cada una se resuelve sola y en el orden que el operador quiera.
 */
export function FirmaView(): React.JSX.Element {
  const project = useActiveProject()
  const projectId = project?.id ?? null
  const cargado = useRepairStore((state) => state.projectId)
  const proposals = useRepairStore((state) => state.proposals)
  const findings = useRepairStore((state) => state.findings)

  useRepairFeed(projectId)

  const cola = cargado === projectId ? colaDeFirma(proposals, findings) : []
  const { visibles, pagina, irA } = usePaginado(cola)

  return (
    <div className="h-full space-y-3 overflow-y-auto px-4 py-4">
      <header>
        <h2 className="text-foreground text-base">Firma</h2>
        <p className="text-muted-foreground text-xs">{subtitulo(project ?? null)}</p>
      </header>

      {cola.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Nada espera firma. Lo que el motor genere y pase el gate aparecera aqui.
        </p>
      ) : (
        <>
          <p className="text-primary text-xs">
            {cola.length} {cola.length === 1 ? 'propuesta espera' : 'propuestas esperan'} firma
          </p>
          <div className="space-y-1">
            {visibles.map((item) => (
              <RepairProposalRow
                key={item.proposal.id}
                proposal={item.proposal}
                finding={item.finding}
              />
            ))}
          </div>
          <Paginador pagina={pagina} onPagina={irA} />
        </>
      )}
    </div>
  )
}
