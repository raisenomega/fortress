/**
 * Por que una propuesta NO llego a GENERADO. La razon viaja en analysis_reason.
 *
 * Es el vocabulario de DESENLACES de un intento, no la lista de lo que produce
 * el estado `RECHAZADO`, y la diferencia se ve en `superseded`: no llego a
 * GENERADO —luego pertenece aqui— pero `generate-guards` la deja en `CADUCADO`,
 * porque a esa propuesta no la juzgo nadie, la reemplazo una mas nueva. Sacarla
 * para "arreglar" la asimetria seria peor: se comprobo quitandola y da dos
 * errores de tipo, porque el generador y la tabla de clasificacion la exigen —
 * el remedio consiste en ponerla dos veces donde estaba una.
 */
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
   * El binario del CLI no llego a arrancar: no existe, no es ejecutable, el
   * PATH esta roto. NO es del agente ni del proveedor: es de la MAQUINA, y por
   * eso corta la tanda —la vuelta siguiente fallaria identica— pero no se
   * reintenta, porque esperar no crea un fichero que falta.
   *
   * Asume causas PERMANENTES, que son las observadas (ENOENT, EACCES). `spawn`
   * tambien emite `error` por EAGAIN o ENOMEM, que si son transitorias y
   * querrian reintento; no se les hace rama porque no se han visto ninguna vez,
   * y aqui no se construye defensa para un caso no observado.
   */
  'cli_no_arranco',
  /**
   * HISTORICO: ya no lo emite nadie. Cubrio timeout, spawn fallido y transicion
   * invalida; se separaron en `generator_timeout`, `cli_no_arranco` e
   * `invalid_state`. Se conserva para que las filas ya escritas se lean.
   */
  'generator_error',
  /** El generador agoto su techo de turnos sin terminar. No es presupuesto. */ 'turnos_agotados',
  /** El analista corrio pero su salida no se dejo leer. No es obsolescencia. */ 'analisis_ilegible',
  'no_diff_produced',
  /** ADR-102: el arreglo declarado no cabe en la correa; no se reintenta, la pausa la levanta el terreno. */
  'arreglo_fuera_de_correa',
  /** Solo toco pruebas: el gate lo daria VERDE. Ver `solo-toca-pruebas`. */ 'solo_pruebas',
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
  'proyecto_sin_confianza',
  /** Sin caja en esta maquina (ADR-092) no se ejecuta codigo del proyecto. */
  'sin_caja'
] as const

export type RejectionReason = (typeof REJECTION_REASONS)[number]

export function isRejectionReason(value: string): value is RejectionReason {
  return (REJECTION_REASONS as readonly string[]).includes(value)
}
