import { useEffect } from 'react'
import { reduceMotorStatus } from '@domain/repair/motor-status'
import { loadRepair } from '../../services/repair-service'
import { useRepairStore } from '../../stores/repair-store'
import { useActiveProject } from '../../stores/project-store'
import { useUiStore } from '../../stores/ui-store'
import { etiqueta, ICONO, titulo, TONO } from './motor-chip-look'

/**
 * Estado del motor del proyecto ACTIVO, junto a su nombre en la barra. Habla
 * del mismo proyecto que la linea de al lado a proposito: un indicador que
 * ocupa ese sitio y se refiere a otro se lee como si fuera de este.
 *
 * No pinta nada mientras las propuestas cargadas no sean las de este proyecto
 * — al cambiar de proyecto, o si la lectura fallo. Callarse es honesto; pintar
 * verde por defecto afirmaria que no hay nada pendiente sin haberlo mirado.
 */
export function MotorChip(): React.JSX.Element | null {
  const project = useActiveProject()
  const projectId = project?.id ?? null
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)
  const cargado = useRepairStore((state) => state.projectId)
  const proposals = useRepairStore((state) => state.proposals)

  useEffect(() => {
    if (projectId !== null) void loadRepair(projectId)
  }, [projectId])

  if (project === null || cargado !== project.id) return null

  const status = reduceMotorStatus(proposals, project.contaminated)
  const Icono = ICONO[status.kind]

  return (
    <button
      type="button"
      onClick={() => setView('motor')}
      aria-pressed={view === 'motor'}
      data-nav="Motor"
      title={titulo(status)}
      className={`tap flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${TONO[status.kind]}`} // prettier-ignore
    >
      <Icono size={13} aria-hidden />
      {etiqueta(status)}
    </button>
  )
}
