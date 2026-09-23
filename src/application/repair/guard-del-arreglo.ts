import { arregloFueraDeCorrea } from '@domain/repair/arreglo-fuera-de-correa'
import { motivoDelArreglo } from '@domain/repair/motivo-del-arreglo'
import type { AppContext } from '../context'
import type { FailFn } from './generate-fail'
import type { Admitted } from './generate-guards'
import type { GenerateDeps, GenerateResult } from './generate-types'
import { emitDecision } from './record-generate-events'

export interface Terreno {
  readonly worktreePath: string
  readonly allowed: readonly string[]
  readonly allows: readonly string[]
}

/**
 * ADR-102 §3 — el guard del arreglo. El analisis ya dice DONDE va el cambio; si
 * ese fichero no cabe en la correa ni en el terreno declarado, el generador no
 * corre: se rechaza con motivo propio, no reintentable, que lleva la huella del
 * terreno para que la pausa la levante el terreno y no el HEAD (§4). Es la
 * regla del diff aplicada ANTES de gastar: 49,71 $ medidos en un ancla donde el
 * analisis decia por escrito que el fix iba en otra capa, y el veto llegaba
 * despues de generar, dieciseis veces.
 *
 * Sin arreglo declarado se genera como hoy (casilla 1): es un freno de gasto,
 * no una defensa —el veto de correa sigue detras del diff—, y el Libro cuenta
 * la omision para revisarla con dato. El worktree se limpia: nunca corrio nada.
 */
export async function guardDelArreglo(
  ctx: AppContext,
  a: Admitted,
  deps: GenerateDeps,
  terreno: Terreno,
  fail: FailFn
): Promise<GenerateResult | null> {
  const { arreglo } = a.analysis
  if (arreglo === undefined) {
    await emitDecision(ctx.eventLog, a.cursor, a.proposal.id, 'ARREGLO_SIN_DECLARAR', { ancla: a.analysis.target.file }, deps.now()) // prettier-ignore
    return null
  }
  const fuera = arregloFueraDeCorrea(arreglo, terreno.allowed, terreno.allows)
  if (fuera === null) return null
  const cfg = deps.huellaDeConfig(terreno.worktreePath)
  const evidencia = { arreglo: fuera, allowed: terreno.allowed, allows: terreno.allows, cfg }
  return fail('arreglo_fuera_de_correa', evidencia, false, motivoDelArreglo(fuera.file, cfg))
}
