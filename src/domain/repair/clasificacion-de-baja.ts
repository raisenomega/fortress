import type { MotivoDeAveria } from './averia'
import type { RejectionReason } from './repair-rejection'

/**
 * Los motivos que llegan al recuento. Las tres averias NO estan: cortan la tanda
 * antes de contarse. `invalid_state` si, y no vive en `REJECTION_REASONS` porque
 * no juzga a la propuesta — es la maquina de estados rechazando una transicion.
 */
export type MotivoDeBaja = Exclude<RejectionReason, MotivoDeAveria> | 'invalid_state'

/**
 * Las casillas se agrupan por la ACCION que el parte le pide al operador, no por
 * la fase que las produjo: leer el diff, mirar su proyecto o abrir un issue
 * nuestro son respuestas distintas, y juntarlas no le dice a nadie que hacer.
 */
export type CasillaDeBaja =
  | 'vetadas'
  | 'porPresupuesto'
  | 'porTimeout'
  | 'porCorrea'
  | 'porLimitePropio'
  | 'porEntornoDelProyecto'
  | 'porDefectoInterno'
  | 'superadas'
  | 'sinClasificar'

/**
 * La tabla, EXHAUSTIVA sobre `MotivoDeBaja`. Anadir un rechazo al vocabulario
 * sin darle casilla no compila, que es la unica forma de que uno nuevo no se
 * cuele: el `else` que esto sustituye se lo habria tragado en silencio, y por eso
 * `turnos_agotados` llevaba meses anunciandose como gate rojo.
 */
const CASILLA: Readonly<Record<MotivoDeBaja, CasillaDeBaja>> = {
  omega_vetado: 'vetadas',
  budget_exceeded: 'porPresupuesto',
  generator_timeout: 'porTimeout',
  gate_timeout: 'porTimeout',
  omega_timeout: 'porTimeout',
  // Las cuatro unicas para las que "mira el diff" es cierto.
  scope_violation: 'porCorrea',
  gate_failed: 'porCorrea',
  no_diff_produced: 'porCorrea',
  solo_pruebas: 'porCorrea',
  // Nuestro techo de turnos. No dice NADA del fix: no hubo juicio.
  turnos_agotados: 'porLimitePropio',
  npm_ci_failed: 'porEntornoDelProyecto', // ni el fix ni nosotros: el repositorio o su worktree
  gate_sin_verificacion: 'porEntornoDelProyecto',
  proyecto_sin_confianza: 'porEntornoDelProyecto',
  sin_caja: 'porEntornoDelProyecto', // ADR-092: la maquina no puede levantar la caja
  worktree_missing: 'porEntornoDelProyecto',
  worktree_contaminated: 'porEntornoDelProyecto',
  // Un bug NUESTRO, no un veredicto sobre la propuesta.
  invalid_state: 'porDefectoInterno',
  omega_response_invalid: 'porDefectoInterno',
  analisis_ilegible: 'porDefectoInterno',
  generator_error: 'porDefectoInterno',
  // No murieron por su culpa: otra las reemplazo, o se reclamaron al arrancar.
  superseded: 'superadas',
  orphan_before_generate: 'superadas'
}

export const MOTIVOS_DE_BAJA = Object.keys(CASILLA) as readonly MotivoDeBaja[]

/**
 * El motivo viaja a veces con sufijo (`omega_vetado: <razon>`,
 * `gate_failed_at=<cmd>`, `superseded_by=<id>`), asi que se busca por prefijo:
 * ninguno del vocabulario es prefijo de otro, y una prueba lo fija.
 *
 * Lo que NO se reconoce cae en `sinClasificar`, y el parte lo DICE. Un motivo
 * desconocido tiene que ser ruidoso: silenciarlo es el defecto que esto arregla.
 */
export function casillaDeBaja(motivo: string): CasillaDeBaja {
  const clave = MOTIVOS_DE_BAJA.find((m) => motivo === m || motivo.startsWith(m))
  return clave === undefined ? 'sinClasificar' : CASILLA[clave]
}
