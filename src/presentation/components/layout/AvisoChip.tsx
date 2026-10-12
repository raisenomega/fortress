import { useState } from 'react'
import { useActiveProject } from '../../stores/project-store'
import { Icon } from '../common/Icon'
import { AvisoContaminacionDialog } from './AvisoContaminacionDialog'

/**
 * PASO 172c: chip [Aviso] ANARANJADO en el header, SOLO para un proyecto CLIENTE
 * contaminado (`contaminated && !esRepoPropio`). Al clic abre el detalle en un
 * diálogo (mismo gesto que el viejo "Motor detenido", pero informativo). FORTRESS
 * contaminado va por su "Motor detenido" del Motor, no por esto.
 */
export function AvisoChip(): React.JSX.Element | null {
  const project = useActiveProject()
  const [abierto, setAbierto] = useState(false)

  if (project === null || !project.contaminated || project.esRepoPropio) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="La auditoría detectó cambios durante el chequeo; no bloquea. Clic para ver el detalle."
        className="tap border-medium/50 text-medium hover:bg-medium/10 flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
      >
        <Icon name="alert-triangle" size={13} />
        Aviso
      </button>
      {abierto ? (
        <AvisoContaminacionDialog project={project} onClose={() => setAbierto(false)} />
      ) : null}
    </>
  )
}
