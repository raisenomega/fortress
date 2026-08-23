import type { AppContext } from '../context'
import type { MotorChainDeps } from './run-motor-chain'
import { runMotorChain } from './run-motor-chain'

/** Por que termino el drenaje. `detenido` es una decision, no un fallo. */
export type FinDelDrenaje = 'sin-candidato' | 'tope-vueltas' | 'tope-gasto' | 'detenido' | 'averia'

export interface DrenajeResultado {
  readonly fin: FinDelDrenaje
  /** Propuestas que quedaron juzgadas y esperando firma. */
  readonly acumuladas: number
  readonly detalle?: string
}

export interface DrenajeDeps {
  readonly motor: MotorChainDeps
  /** El operador dijo basta. Se consulta antes y despues de cada vuelta. */
  readonly cancelado: () => boolean
  /** Dolares gastados en esta sesion de drenaje. */
  readonly gastado: () => number
  readonly maxVueltas: number
  readonly costCapUsd: number
}

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
  let acumuladas = 0
  const fin = (f: FinDelDrenaje, detalle?: string): DrenajeResultado =>
    detalle === undefined ? { fin: f, acumuladas } : { fin: f, acumuladas, detalle }

  for (let vuelta = 0; vuelta < deps.maxVueltas; vuelta += 1) {
    if (deps.cancelado()) return fin('detenido')
    if (deps.gastado() >= deps.costCapUsd) return fin('tope-gasto')

    const salida = await runMotorChain(ctx, projectId, deps.motor, 'hasta-omega')
    // Antes de leer el resultado: parar mata al hijo, y el hijo muriendo se
    // parece a una averia. Una parada humana es una parada, no un fallo.
    if (deps.cancelado()) return fin('detenido')
    if (!salida.ok) return fin('averia', salida.error)
    if (salida.value.kind === 'sin-candidato') return fin('sin-candidato')
    if (salida.value.kind === 'espera-firma') acumuladas += 1
  }
  return fin('tope-vueltas')
}
