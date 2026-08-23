import type { AppContext } from '../context'
import { runMotorChain } from './run-motor-chain'
import type { DrenajeDeps, DrenajeResultado, FinDelDrenaje } from './drenaje-types'

export type { DrenajeDeps, DrenajeResultado, FinDelDrenaje } from './drenaje-types'

/**
 * Recorre los hallazgos elegibles de un proyecto dejando cada fix juzgado y
 * esperando firma. No escanea, no espera entre vueltas y no escribe al chat:
 * no es el loop, y reusarlo habria arrastrado las tres cosas.
 *
 * No lleva cuenta de a quien ha atendido. Una propuesta viva excluye a su
 * hallazgo de la seleccion, asi que la vuelta siguiente elige otro sola y el
 * pozo se vacia sin que nadie lo administre. Cuando no queda nadie, `planRepair`
 * devuelve sin-candidato y eso es el final normal: agotar los elegibles, no
 * chocar con un tope.
 */
export async function drenarHastaOmega(
  ctx: AppContext,
  projectId: string,
  deps: DrenajeDeps
): Promise<DrenajeResultado> {
  const cuenta = { trabajadas: 0, acumuladas: 0, vetadas: 0, porPresupuesto: 0, otrasBajas: 0 }
  const fin = (f: FinDelDrenaje, detalle?: string): DrenajeResultado =>
    detalle === undefined ? { fin: f, ...cuenta } : { fin: f, ...cuenta, detalle }

  /** Una baja, clasificada por su motivo. El motivo llega con sufijos a veces
   *  ("omega_vetado: <razon>"), asi que se mira el prefijo. */
  const anotarBaja = (motivo: string): void => {
    if (motivo.startsWith('omega_vetado')) cuenta.vetadas += 1
    else if (motivo.startsWith('budget_exceeded')) cuenta.porPresupuesto += 1
    else cuenta.otrasBajas += 1
  }

  for (let vuelta = 0; vuelta < deps.maxVueltas; vuelta += 1) {
    if (deps.cancelado()) return fin('detenido')
    if (deps.gastado() >= deps.costCapUsd) return fin('tope-gasto')

    const salida = await runMotorChain(ctx, projectId, deps.motor, 'hasta-omega')
    // Antes de leer el resultado: parar mata al hijo, y el hijo muriendo se
    // parece a una averia. Una parada humana es una parada, no un fallo.
    if (deps.cancelado()) return fin('detenido')
    if (!salida.ok) return fin('averia', salida.error)
    if (salida.value.kind === 'sin-candidato') return fin('sin-candidato')

    cuenta.trabajadas += 1
    if (salida.value.kind === 'espera-firma') cuenta.acumuladas += 1
    else if (salida.value.kind === 'descartada') anotarBaja(salida.value.motivo)
  }
  return fin('tope-vueltas')
}
