import { colaDeFirma } from '../system/cola-de-firma'
import { useRepairStore } from '../../stores/repair-store'
import { useActiveProject } from '../../stores/project-store'
import { useUiStore } from '../../stores/ui-store'
import { etiquetaFirma, tituloFirma } from './firma-chip-look'
import { useRepairFeed } from '../../hooks/useRepairFeed'
import { Icon } from '../common/Icon'

/**
 * Cuantas propuestas del proyecto ACTIVO esperan firma, y la puerta a su pagina.
 *
 * No se pinta con la cola vacia. Un chip cuyo unico trabajo es avisar de que
 * alguien te espera, diciendo cero de forma permanente, entrena a no mirarlo; y
 * su pagina no tendria nada que ensenar. Tampoco se pinta si las propuestas
 * cargadas no son las de este proyecto: callarse es honesto, dar un numero de
 * otro proyecto no.
 */
export function FirmaChip(): React.JSX.Element | null {
  const project = useActiveProject()
  const projectId = project?.id ?? null
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)
  const cargado = useRepairStore((state) => state.projectId)
  const proposals = useRepairStore((state) => state.proposals)
  const findings = useRepairStore((state) => state.findings)

  useRepairFeed(projectId)

  if (project === null || cargado !== project.id) return null

  const cuantas = colaDeFirma(proposals, findings).length
  if (cuantas === 0) return null

  return (
    <button
      type="button"
      onClick={() => setView('firma')}
      aria-pressed={view === 'firma'}
      data-nav="Firma"
      title={tituloFirma(cuantas)}
      className="tap border-primary/50 text-primary hover:bg-primary/10 flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
    >
      <Icon name="eye" size={13} />
      {etiquetaFirma(cuantas)}
    </button>
  )
}
