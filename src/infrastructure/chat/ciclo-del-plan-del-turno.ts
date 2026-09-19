import { appendMessage } from '@application/chat/chat-history'
import { hastaAprobarElPlan } from '@application/chat/ciclo-del-plan'
import type { JuezDelPlan } from '@application/chat/juez-del-plan'
import type { AppContext } from '@application/context'
import { parteDeDecisionAbierta } from '@domain/chat/decision-abierta'
import type { VeredictoDelPlan } from '@domain/chat/juicio-del-plan'
import { aprobarLote } from '../aprobacion-del-plan'

export interface CicloDelPlanDelTurno {
  readonly context: AppContext
  readonly projectId: string
  readonly ids: readonly string[]
  /** La prosa que el turno ya produjo: es la propuesta NUMERO UNO. */
  readonly propuesta: string
  /** Re-propone con la objecion de OMEGA. Es OTRO turno del productor, visible
   *  en el hilo: el operador lee cada vuelta, no solo el final (ADR-091 §0). */
  readonly reproponer: (pedido: string) => Promise<string>
  readonly juez: JuezDelPlan
  readonly avisar: () => void
}

/**
 * El parte del lote que se quedo sin direccion, escrito en el hilo. Va por el
 * MAIN porque el bucle vive aqui, y como `system`: no lo dijo el productor ni el
 * operador — lo dice FORTRESS sobre si misma.
 */
function anotarDecisionAbierta(d: CicloDelPlanDelTurno, intentos: number): void {
  appendMessage(d.context, {
    projectId: d.projectId,
    role: 'system',
    content: parteDeDecisionAbierta(d.ids.length, intentos),
    agentId: null,
    mode: 'autonomo',
    engine: 'claude-code'
  })
}

/**
 * Propone, deja que OMEGA mire la direccion, y si pide replantear REPROPONE —
 * hasta aprobar o hasta que deje de avanzar (ADR-097 §3 y §5).
 *
 * Tres finales, y los tres distintos a proposito:
 * - APROBADO: `aprobarLote` abre la puerta del §4. La escribe el MAIN, aqui.
 * - AGOTADO: el productor volvio dos veces sobre la misma propuesta. Se anota
 *   «Decision abierta — necesita un humano» y NO se aprueba nada. Los hallazgos
 *   se quedan exactamente como estaban: abiertos y sin tocar.
 * - SIN JUEZ: OMEGA no se dejo leer. `null`, y tampoco aprueba — no poder mirar
 *   no es aprobar. Y NO se anota decision abierta: eso es una averia, no un
 *   limite alcanzado, y confundirlas le diria al operador que decida algo
 *   cuando lo que hay que hacer es mirar por que no arranco el revisor.
 */
export async function correrElCicloDelPlan(
  d: CicloDelPlanDelTurno
): Promise<VeredictoDelPlan | null> {
  const fin = await hastaAprobarElPlan({
    proponer: (replanteo) =>
      replanteo === null ? Promise.resolve(d.propuesta) : d.reproponer(replanteo),
    // Una repropuesta VACIA es un turno que fallo, no un plan. Juzgarla seria
    // peor que inutil: sin nada que leer, OMEGA contesta NO_SE_PUEDE_SABER, y
    // eso NO deniega (§2.3) — o sea que un turno caido acabaria APROBANDO.
    juzgar: (propuesta) =>
      propuesta.trim() === '' ? Promise.resolve(null) : (d.avisar(), d.juez(d.ids, propuesta))
  })

  if (fin.aprobado) {
    aprobarLote(d.projectId, d.ids)
    return 'ADELANTE'
  }
  if (fin.razon === null) return null

  anotarDecisionAbierta(d, fin.intentos)
  return 'REPLANTEA'
}
