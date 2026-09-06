import type { MotorChainDeps } from './run-motor-chain'

/**
 * Por que termino el drenaje. `detenido` es una decision, no un fallo; `entorno`
 * no es una averia del proveedor sino esta maquina, que se arregla de otra
 * manera; y `ocupado` no es un fallo en absoluto — es un freno del sistema
 * (tope diario, otra corrida, proyecto en revision) haciendo su trabajo.
 */
// prettier-ignore
export type FinDelDrenaje = 'sin-candidato' | 'tope-vueltas' | 'tope-gasto' | 'detenido' | 'ocupado' | 'averia' | 'entorno'

/**
 * Lo que la corrida HIZO, no solo lo que dejo. Un parte que solo contaba las
 * que esperan firma leia una corrida de tres —dos aprobadas y una muerta por
 * presupuesto— como si hubiera trabajado dos, y el operador se pregunto por que
 * el drenaje "paro antes de tiempo" cuando habia agotado el pozo.
 */
export interface DrenajeResultado {
  readonly fin: FinDelDrenaje
  /** Vueltas que movieron el expediente de alguien. */
  readonly trabajadas: number
  /** Propuestas que quedaron juzgadas y esperando firma. */
  readonly acumuladas: number
  /** El revisor dijo que no. */
  readonly vetadas: number
  /** Murieron al pasarse del tope por propuesta. */
  readonly porPresupuesto: number
  /** El reloj de alguno de los tres jueces se agoto. Casilla propia: una
   *  propuesta perdida por tiempo no dice nada del fix, y contarla con las del
   *  gate mandaba a leer un diff que nunca llego a juzgarse. */
  readonly porTimeout: number
  /** Gate rojo, correa rota, sin diff: las UNICAS que mandan a leer el diff. */
  readonly porCorrea: number
  /** Se quedo sin turnos. Nuestro techo, no un juicio: nadie miro el fix. */
  readonly porLimitePropio: number
  /** Ni el fix ni nosotros: el repositorio o su worktree (npm ci, sin scripts
   *  de verificacion, proyecto sin confianza, worktree perdido o sucio). */
  readonly porEntornoDelProyecto: number
  /** Un bug NUESTRO —transicion invalida, respuesta que no se deja leer— y no
   *  un veredicto sobre la propuesta. Se arregla con un issue, no con un fix. */
  readonly porDefectoInterno: number
  /** No murio por su culpa: otra la reemplazo, o se reclamo al arrancar. */
  readonly superadas: number
  /** Motivo fuera del vocabulario. Se anuncia a proposito: un desenlace que no
   *  sabemos nombrar tiene que verse, no diluirse en la casilla de al lado. */
  readonly sinClasificar: number
  readonly detalle?: string
}

export interface DrenajeDeps {
  readonly motor: MotorChainDeps
  /** El operador dijo basta. Se consulta antes y despues de cada vuelta. */
  readonly cancelado: () => boolean
  /** Dolares gastados en esta sesion de drenaje. */
  readonly gastado: () => number
  /**
   * El motivo del tope del DIA, o null si todavia cabe. Es OTRO tope: `gastado`
   * mide esta sesion y este proyecto, y el del dia suma todo lo que se ha
   * gastado hoy por cualquier via. Se consulta cada vuelta porque un drenaje
   * dura media hora y el que arranca cerca del tope se lo pasaba entero.
   *
   * Llega como funcion —y no como `guardRun`— porque el drenaje YA tiene el
   * carril tomado desde su handler: pedirlo otra vez se responderia a si mismo
   * que esta ocupado, que es la reentrancia que costo la Familia E.
   */
  readonly topeDiario: () => string | null
  readonly maxVueltas: number
  readonly costCapUsd: number
}
