import { useState } from 'react'
import { drenar, pararDrenaje } from '../services/drenaje-service'
import { notify } from '../stores/toast-store'
import { actoDeDrenar } from '../components/system/acto-de-drenar'
import { useTopesDelDrenaje, type Topes } from './useTopesDelDrenaje'

export interface ConfirmacionDrenaje {
  readonly preguntando: boolean
  readonly topes: Topes
  readonly alPulsar: () => void
  readonly cerrar: () => void
  readonly arrancar: () => void
}

/**
 * El pequeno estado de "preguntar antes de gastar", fuera del boton.
 *
 * Drenando, el mismo boton para. Parado, pregunta; y si no hay a quien atender
 * lo dice, en vez de arrancar una corrida en vano. Vive aparte porque son tres
 * caminos con estado propio y el boton solo tiene que pintarse.
 */
export function useConfirmarDrenaje(
  projectId: string | null,
  drenando: boolean,
  elegibles: number
): ConfirmacionDrenaje {
  const [preguntando, setPreguntando] = useState(false)
  const topes = useTopesDelDrenaje(preguntando)

  const alPulsar = (): void => {
    if (projectId === null) return
    const acto = actoDeDrenar(drenando, elegibles)
    if (acto === 'parar') return void pararDrenaje(projectId)
    if (acto === 'nada-que-drenar') {
      return notify('No hay nada que drenar: ningun hallazgo elegible.')
    }
    setPreguntando(true)
  }

  const arrancar = (): void => {
    setPreguntando(false)
    if (projectId !== null) void drenar(projectId)
  }

  return { preguntando, topes, alPulsar, cerrar: () => setPreguntando(false), arrancar }
}
