/** Por que una propuesta NO llego a GENERADO. La razon viaja en analysis_reason. */
export const REJECTION_REASONS = [
  'scope_violation',
  'budget_exceeded',
  /**
   * NUESTRO reloj se agoto, no el proveedor. Limite propio: no se reintenta
   * —repetir sin cambiar nada da lo mismo— y no para la tanda, porque la
   * propuesta siguiente puede terminar en tres minutos.
   */
  'generator_timeout',
  /**
   * El CLI salio con codigo de error: 429, cuota, corte de red o un crash suyo.
   * Es una BOLSA DE DOS a proposito: desde fuera todas salen con el mismo codigo
   * distinto de cero, y no hay ni un 429 registrado con el que separarlas. Se
   * parte cuando haya uno que estudiar, no antes.
   */
  'provider_error',
  /**
   * HISTORICO: ya no lo emite nadie. Cubrio a la vez el timeout, el spawn
   * fallido y la transicion invalida —tres naturalezas bajo un nombre que
   * acusaba al generador de las tres—. Los dos primeros se separaron; la
   * tercera resulto no ser suya, sino de la maquina de estados, y se llama
   * `invalid_state`. Se conserva para que las filas ya escritas se lean.
   */
  'generator_error',
  /** El generador agoto su techo de turnos sin terminar. No es presupuesto. */
  'turnos_agotados',
  /** El analista corrio pero su salida no se dejo leer. No es obsolescencia. */
  'analisis_ilegible',
  'no_diff_produced',
  'worktree_contaminated',
  'orphan_before_generate',
  'superseded',
  'gate_failed',
  'gate_timeout',
  'npm_ci_failed',
  /** El proyecto no declara ningun script con el que verificar el fix. */
  'gate_sin_verificacion',
  'worktree_missing',
  'omega_vetado',
  'omega_timeout',
  'omega_error',
  'omega_response_invalid',
  /** El proyecto no es de confianza: el gate no ejecuta su codigo. */
  'proyecto_sin_confianza'
] as const

export type RejectionReason = (typeof REJECTION_REASONS)[number]

export function isRejectionReason(value: string): value is RejectionReason {
  return (REJECTION_REASONS as readonly string[]).includes(value)
}
