import { useEffect } from 'react'
import { api } from '../adapters/fortress-api'
import { loadRepair } from '../services/repair-service'

/**
 * Mantiene el expediente del proyecto al dia: lo carga al entrar y lo relee
 * cuando el motor avisa de que se movio.
 *
 * El aviso trae solo el id del proyecto y de ahi se relee la base, en vez de
 * viajar el estado entero por el puente. Asi no hay una segunda copia del mismo
 * hecho con su propio momento de quedarse vieja.
 *
 * Sin esto, la pantalla se quedaba en la foto del ultimo clic — que basta
 * mientras conduce una persona, y deja de bastar en cuanto conduzca el loop.
 */
export function useRepairFeed(projectId: string | null): void {
  useEffect(() => {
    if (projectId === null) return
    void loadRepair(projectId)
    return api().repair.onChanged((id) => id === projectId && void loadRepair(projectId))
  }, [projectId])
}
