const CLAVE = 'fortress-barra-del-chat'
const CLAVE_EXPANDIDAS = 'fortress-carpetas-expandidas'

/** El almacen de la barra del Chat (split del store por el techo de lineas).
 *  Conveniencia por-vista (no estado que importe): si localStorage falla —
 *  previews, datos borrados— la barra abre por defecto y el arbol plegado. */
export const leerAbierta = (): boolean => {
  try {
    return globalThis.localStorage?.getItem(CLAVE) !== 'cerrada'
  } catch {
    return true
  }
}

export const guardarAbierta = (abierta: boolean): void => {
  try {
    globalThis.localStorage?.setItem(CLAVE, abierta ? 'abierta' : 'cerrada')
  } catch {
    // Sin almacen: la proxima sesion abre por defecto, nada se rompe.
  }
}

/** Revision A: que carpetas estan DESPLEGADAS en el acordeon. */
export const leerExpandidas = (): readonly string[] => {
  try {
    const crudo = globalThis.localStorage?.getItem(CLAVE_EXPANDIDAS) ?? '[]'
    const valor: unknown = JSON.parse(crudo)
    return Array.isArray(valor) ? valor.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export const guardarExpandidas = (expandidas: readonly string[]): void => {
  try {
    globalThis.localStorage?.setItem(CLAVE_EXPANDIDAS, JSON.stringify(expandidas))
  } catch {
    // Sin almacen: la proxima sesion arranca plegada, nada se rompe.
  }
}
