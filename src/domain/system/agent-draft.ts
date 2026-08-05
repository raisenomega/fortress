import type { IconName } from '../shared/icon-name'

/** Techo de capacidades activas a la vez (freno v1, configurable a futuro). */
export const MAX_ACTIVE_CAPABILITIES = 3

/**
 * Definicion de un agente auto-propuesto: un DATO que el motor consume via
 * `--agents`, nunca codigo generado. En v1 la escribe el operador; mas adelante
 * podra redactarla un agente. Es solo un prompt con su nombre e icono.
 */
export interface AgentDraft {
  readonly name: string
  readonly prompt: string
  readonly iconName: IconName
}

const RED_FLAGS: readonly string[] = [
  'dangerously',
  'skip-permission',
  'bypass',
  'ignora las reglas',
  'sin permiso',
  'desactiva la seguridad'
]

/**
 * Auditoria de contenido de OMEGA sobre un borrador: senala frases que intentan
 * saltarse los frenos. Con concerns, la activacion se bloquea. Pura y testeable;
 * OMEGA veta con evidencia (la frase), nunca aprueba.
 */
export function draftConcerns(draft: AgentDraft): readonly string[] {
  const text = `${draft.name}\n${draft.prompt}`.toLowerCase()
  return RED_FLAGS.filter((flag) => text.includes(flag))
}
