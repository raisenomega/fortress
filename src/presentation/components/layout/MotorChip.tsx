import { reduceMotorStatus } from '@domain/repair/motor-status'
import { useRepairStore } from '../../stores/repair-store'
import { useActiveProject } from '../../stores/project-store'
import { useUiStore } from '../../stores/ui-store'
import { detenido, tituloDetenido } from './motor-chip-look'
import { useRepairFeed } from '../../hooks/useRepairFeed'
import { Icon } from '../common/Icon'

/**
 * Avisa de que el motor del proyecto ACTIVO esta PARADO, y lleva a su panel.
 *
 * No pinta nada cuando el motor esta sano: un indicador permanente que casi
 * siempre dice "todo bien" ensena a no mirarlo, y justo el dia que cambia nadie
 * lo ve. Tampoco pinta si las propuestas cargadas no son las de este proyecto
 * —al cambiar de proyecto, o si la lectura fallo—: callarse es honesto, decir
 * que esta sano sin haberlo mirado no.
 */
export function MotorChip(): React.JSX.Element | null {
  const project = useActiveProject()
  const projectId = project?.id ?? null
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)
  const cargado = useRepairStore((state) => state.projectId)
  const proposals = useRepairStore((state) => state.proposals)

  useRepairFeed(projectId)

  if (project === null || cargado !== project.id) return null

  // PASO 172a: "Motor detenido" por contaminacion es del mundo FORTRESS; un
  // cliente contaminado trabaja libre y nunca se pinta "detenido".
  const parado = detenido(reduceMotorStatus(proposals, project.contaminated && project.esRepoPropio)) // prettier-ignore
  if (parado === null) return null

  return (
    <button
      type="button"
      onClick={() => setView('motor')}
      aria-pressed={view === 'motor'}
      data-nav="Motor"
      title={tituloDetenido(parado.razon)}
      className="tap border-critical/50 text-critical hover:bg-critical/10 flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
    >
      <Icon name="alert-triangle" size={13} />
      Motor: detenido
    </button>
  )
}
