import { useState } from 'react'
// prettier-ignore
import { pararVerificacionMasiva, verificarTodosLosMitigados } from '../services/verificacion-masiva-service'
import { notify } from '../stores/toast-store'
import { actoDeVerificar } from '../components/scan/acto-de-verificar'

export interface ConfirmacionVerificacion {
  readonly preguntando: boolean
  readonly alPulsar: () => void
  readonly cerrar: () => void
  readonly arrancar: () => void
}

const NADA = 'No hay nada que verificar: ningun hallazgo esta marcado como mitigado.'

/**
 * El pequeno estado de «preguntar antes de gastar», fuera del boton. Molde de
 * `useConfirmarDrenaje`: verificando, el mismo boton para; parado, pregunta; y
 * si no hay a quien atender lo dice, en vez de arrancar un barrido en vano.
 *
 * `arrancar` cierra el dialogo ANTES de lanzar, no despues: lanzar espera horas,
 * y esperar con el modal abierto lo dejaria pegado toda la corrida.
 */
export function useConfirmarVerificacion(
  projectId: string | null,
  verificando: boolean,
  mitigados: number
): ConfirmacionVerificacion {
  const [preguntando, setPreguntando] = useState(false)

  const alPulsar = (): void => {
    if (projectId === null) return
    const acto = actoDeVerificar(verificando, mitigados)
    if (acto === 'parar') return void pararVerificacionMasiva(projectId)
    if (acto === 'nada-que-verificar') return notify(NADA)
    setPreguntando(true)
  }

  const arrancar = (): void => {
    setPreguntando(false)
    if (projectId !== null) void verificarTodosLosMitigados(projectId, mitigados)
  }

  return { preguntando, alPulsar, cerrar: () => setPreguntando(false), arrancar }
}
