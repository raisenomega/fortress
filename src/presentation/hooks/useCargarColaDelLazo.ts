import { useEffect } from 'react'
import { cargarColaDelLazo } from '../services/cargar-cola-del-lazo'
import { useLazoStore } from '../stores/lazo-store'
import { useProjectStore } from '../stores/project-store'

/**
 * Al ENCENDER el lazo (activo: false->true), congela su cola —el snapshot
 * estable—. Vive en un hook, fuera del camino del envío (ATERRIZAJE-1 no toca el
 * envío): solo observa el on/off y dispara la carga. Montado una vez en App.
 */
export function useCargarColaDelLazo(): void {
  const activo = useLazoStore((s) => s.activo)
  useEffect(() => {
    if (!activo) return
    const projectId = useProjectStore.getState().activeProjectId
    if (projectId !== null) void cargarColaDelLazo(projectId)
  }, [activo])
}
