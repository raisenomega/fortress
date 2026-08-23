import { useState } from 'react'
import type { Project } from '@domain/project/project'
import { useActiveProject } from '../../stores/project-store'
import { useRepairStore } from '../../stores/repair-store'
import { useRepairFeed } from '../../hooks/useRepairFeed'
import { colaDeFirma } from './cola-de-firma'
import { ColaDeFirma } from './ColaDeFirma'
import { paginar } from './paginacion'
import { PaginadorFirma } from './PaginadorFirma'

const subtitulo = (project: Project | null): string =>
  project === null
    ? 'Selecciona un proyecto para ver lo que espera tu firma.'
    : `Propuestas de ${project.name} que ya pasaron el gate. Firmar es lo unico que integra.`

/**
 * La cola de firma en su propia pagina.
 *
 * Vivia embebida arriba del expediente del motor, y ahi competia por el sitio
 * con la lista entera de propuestas: firmar es un acto distinto de mirar como
 * va el motor, y mezclarlos obligaba a buscar la cola entre lo demas. Aqui solo
 * se firma, y se llega desde el chip de la barra sin perder el contexto.
 */
export function FirmaView(): React.JSX.Element {
  const project = useActiveProject()
  const projectId = project?.id ?? null
  const cargado = useRepairStore((state) => state.projectId)
  const proposals = useRepairStore((state) => state.proposals)
  const findings = useRepairStore((state) => state.findings)
  const [pedida, setPedida] = useState(1)

  useRepairFeed(projectId)

  const cola = cargado === projectId ? colaDeFirma(proposals, findings) : []
  const pagina = paginar(cola.length, pedida)

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
          <ColaDeFirma cola={cola} visibles={cola.slice(pagina.desde, pagina.hasta)} />
          <PaginadorFirma pagina={pagina} onPagina={setPedida} />
        </>
      )}
    </div>
  )
}
