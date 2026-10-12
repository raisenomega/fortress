import { useEffect } from 'react'
import { restaurarAlParar, stashAlArrancar } from '../services/arbol-del-lazo'
import { useLazoStore } from '../stores/lazo-store'
import { useProjectStore } from '../stores/project-store'

/**
 * ATERRIZAJE-4: al ENCENDER el lazo (activo: false->true) stashea el WIP del
 * cliente —arbol limpio para que el commit durable tome solo lo del agente—; al
 * apagarlo (cleanup del efecto) restaura el WIP. Vive en un hook, fuera del
 * camino del envio, como la carga de la cola. Montado una vez en App.
 */
export function useArbolDelLazo(): void {
  const activo = useLazoStore((s) => s.activo)
  useEffect(() => {
    if (!activo) return
    const projectId = useProjectStore.getState().activeProjectId
    if (projectId === null) return
    void stashAlArrancar(projectId)
    return () => {
      void restaurarAlParar(projectId)
    }
  }, [activo])
}
