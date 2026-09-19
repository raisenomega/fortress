import { juezDelPlan, type JuezDelPlanDeps } from '@application/chat/juez-del-plan'
import type { SendMessageInput } from '@application/chat/send-message-types'
import { esAutonomoDeVerdad } from '@application/settings/modo-guardado'
import type { StepProgress } from '@application/workflow/step-progress'
import type { AppContext } from '@application/context'
import type { VeredictoDelPlan } from '@domain/chat/juicio-del-plan'
import { aprobarLote } from '../aprobacion-del-plan'

export interface JuicioDelPlanDelTurno {
  readonly context: AppContext
  readonly input: SendMessageInput
  /** La prosa que el productor acaba de escribir en este turno. */
  readonly propuesta: string
  readonly avisar: (p: StepProgress) => void
  /** El MISMO corredor del critico, inyectado por quien atiende el envio. */
  readonly omega: JuezDelPlanDeps['omega']
}

/** El turno de PLAN del lote: lleva la lista y NO lleva foco. Con foco es un
 *  turno de RESOLUCION, y ese no se juzga aqui — lo juzga el fix, con el diff. */
const esTurnoDePlan = (input: SendMessageInput): boolean =>
  (input.lote ?? []).length > 0 && input.findingId === undefined

/**
 * OMEGA en la silla del aprobador (ADR-097 §3): tras el turno de plan, juzga la
 * direccion y, si dice ADELANTE, APRUEBA el lote.
 *
 * Esta es la otra mitad de la puerta del §4. Aquella cierra el paso; esta es el
 * UNICO camino legitimo de cruzarla — y por eso `aprobarLote` se llama aqui, en
 * el main, y no viaja nunca como campo que el renderer pueda poner. Quien pide
 * pasar no firma su propio permiso.
 *
 * El modo sale de `esAutonomoDeVerdad` —la BASE— y NUNCA de `input.mode`: el
 * turno de plan manda `supervisado` a proposito aunque el proyecto corra en
 * autonomo (`lote-por-enter.ts`), asi que leer el mensaje aqui aprobaria lotes
 * que nadie pidio aprobar solos.
 *
 * En supervisado devuelve `null` sin gastar nada: alli el aprobador es el
 * operador y su Enter ES la autorizacion (ADR-088, arco 1).
 *
 * Vive en la INFRA y no dentro de `sendMessage` porque necesita la prosa QUE EL
 * TURNO PRODUJO: antes de acabar, ese plan no existe. Y porque esa funcion ya
 * carga once parametros posicionales — una deuda nombrada, que esto no amplia.
 */
export async function juzgarElPlanDelLote(
  d: JuicioDelPlanDelTurno
): Promise<VeredictoDelPlan | null> {
  if (!esTurnoDePlan(d.input) || !esAutonomoDeVerdad(d.context)) return null
  const project = d.context.projects.findById(d.input.projectId)
  if (!project) return null

  // La barra lo dice ANTES de arrancar: juzgar el plan tarda, y en el ensayo del
  // 18-sep seis minutos mudos se leyeron como «no hizo nada».
  d.avisar({ index: 0, total: 1, tokens: 0, costUsd: 0, fase: 'plan' })

  const ids = d.input.lote ?? []
  const juez = juezDelPlan({ context: d.context, projectId: project.id, cwd: project.path, omega: d.omega }) // prettier-ignore
  const juicio = await juez(ids, d.propuesta)

  if (juicio?.veredicto === 'ADELANTE') aprobarLote(project.id, ids)
  return juicio?.veredicto ?? null
}
