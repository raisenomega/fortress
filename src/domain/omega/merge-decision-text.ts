import type { MergeDecision } from './merge-decision'

/**
 * Por que NO se integro sola, en orden de la cadena. La configuracion va
 * primero: si no se puede leer, no hay politica que evaluar. La AUSENCIA de
 * politica distingue ese caso, igual que gate y revisor nulos dicen que esa
 * fase no llego a correr.
 *
 * El fallo de git va el ULTIMO porque es el unico que ocurre despues de que
 * todo lo demas dijera que si. Sin esa rama, una decision que paso los cuatro
 * filtros y murio aplicando el merge se asentaria como aplicada.
 */
export function motivo(d: MergeDecision): string | null {
  if (d.configError !== null) return `configuracion ilegible — ${d.configError}`
  if (d.policy === null) return 'la politica no se llego a evaluar'
  if (d.policy.reason !== null) return `politica — ${d.policy.reason}`
  if (d.gate !== null && !d.gate.ok) return `gate — ${d.gate.reason} en ${d.gate.failedAt}`
  if (d.omega !== null && d.omega.veredicto_global === 'VETADO') {
    return `revisor — ${d.omega.razon}`
  }
  if (d.applyError !== null) return `git — ${d.applyError}`
  return null
}

/** Lo comprobable despues: que se miro, no solo que se decidio. */
export function evidencia(d: MergeDecision): string {
  const partes = [
    `propuesta=${d.proposalId.slice(0, 8)}`,
    `severidad=${d.severity}`,
    `lineas=${d.diffLines}`,
    `archivos=${d.files.join(', ')}`
  ]
  if (d.commitSha !== null) partes.push(`commit=${d.commitSha.slice(0, 7)}`)
  if (d.policy?.conditionFailed != null) partes.push(`condicion=${d.policy.conditionFailed}`)
  return partes.join(' · ')
}
