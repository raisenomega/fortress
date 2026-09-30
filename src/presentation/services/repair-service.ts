import type { PlanNegado } from '@application/repair/resultado-del-plan'
import { NO_ES_SU_VEHICULO, VA_POR_EL_TERMINAL } from '@domain/repair/vehiculo-del-motor'
import { api } from '../adapters/fortress-api'
import { notify, reportError } from '../stores/toast-store'
import { useRepairStore } from '../stores/repair-store'

const SIN_CANDIDATO =
  'No hay hallazgo que reparar en este proyecto: escanealo primero, o los que quedan ya tienen propuesta viva.'

const SIN_DIRIGIDO =
  'El motor no puede atender ese hallazgo: o ya tiene una propuesta viva, o su severidad queda fuera de lo que estrena (LOW, MEDIUM y HIGH).'

/**
 * Por que no hubo propuesta, en la frase que toca. El perimetro tiene la suya
 * (ADR-107): decirle «no hay nada que reparar» a quien pulsa sobre un proyecto
 * de cliente seria falso, y ademas no le diria a donde ir.
 */
const motivoDelPlan = (reason: PlanNegado, dirigido: boolean): string => {
  if (reason === NO_ES_SU_VEHICULO) return VA_POR_EL_TERMINAL
  return dirigido ? SIN_DIRIGIDO : SIN_CANDIDATO
}

/**
 * Relee el expediente de propuestas y los hallazgos (para pintar cada fila).
 *
 * Si la lectura falla NO se guarda nada: el slot conserva el proyecto anterior,
 * su id no coincide con el activo y quien lee se calla. Guardar listas vacias
 * afirmaria que este proyecto no tiene propuestas sin haberlo comprobado.
 */
export async function loadRepair(projectId: string): Promise<void> {
  try {
    const [proposals, findings, cerco] = await Promise.all([
      api().repair.list(projectId),
      api().scan.findings(projectId),
      api().repair.cerco(projectId)
    ])
    useRepairStore.getState().setData(projectId, proposals, findings, cerco)
  } catch (error) {
    console.error('[motor] no se pudo leer el expediente', projectId, error)
  }
}

/**
 * C1 elige + C2 analiza (agente real, solo lectura; puede tardar minutos).
 *
 * Un resultado correcto SIN propuesta se avisa igual: el motor no encontro
 * candidato, y sin ese aviso el boton se tragaria el clic en silencio. Sobre
 * el propio repo nunca se noto —siempre hay escaneo—; sobre un proyecto recien
 * registrado es el caso normal.
 *
 * Con `findingId` el vacio significa otra cosa —el operador senalo un hallazgo
 * concreto y ese no se puede atender—, asi que se avisa con otra frase: decirle
 * "no hay nada que reparar" cuando acaba de senalar algo seria mentirle.
 */
export async function proposeRepair(projectId: string, findingId?: string): Promise<void> {
  if (useRepairStore.getState().busy) return

  useRepairStore.getState().setBusy(true)
  try {
    const result = await api().repair.propose(projectId, findingId)
    if (!result.ok) reportError(result.error)
    else if (!result.value.ok) notify(motivoDelPlan(result.value.reason, findingId !== undefined))
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al proponer la reparacion')
  } finally {
    useRepairStore.getState().setBusy(false)
    await loadRepair(projectId)
  }
}
