import type { TokenUsage } from '../telemetry/token-usage'

/**
 * Lo que el agente DEVUELVE. Vive aparte de `code-agent.ts` —donde estan la
 * peticion y el puerto— porque al llegar el recibo el fichero unico paso de 75
 * lineas. La costura es la direccion: lo que entra, lo que sale, y el contrato.
 */
export interface CodeAgentReply {
  readonly text: string
  readonly failed: boolean
  /** Operaciones que el agente quiso hacer y el modo de permisos bloqueo. Es la
   *  nota de TRANSPARENCIA: lleva el comando, que el operador necesita leer. */
  readonly denials: readonly string[]
  /** Los NOMBRES de esas herramientas, sin comando. Es de lo que FORTRESS
   *  aprende (ADR-085): generico, agrupable y sin codigo del cliente dentro. */
  readonly deniedTools?: readonly string[]
  /** Lo que costo la ejecucion, segun el propio CLI. */
  readonly usage: TokenUsage
  /** Herramientas usadas, en orden. De aqui salen los "fixes aplicados". */
  readonly tools: readonly string[]
  /**
   * El RECIBO (ADR-093): las mismas herramientas CON lo que corrieron. Gemelo de
   * `denials` —que lleva el comando porque el operador necesita leerlo— y no de
   * `deniedTools`, que va sin el porque alimenta lo que FORTRESS aprende
   * (ADR-085). El recibo es para el operador y NO viaja a auto-mejora.
   *
   * Llega SIN tachar: se tacha en la ultima puerta antes del disco.
   */
  readonly recibo?: readonly string[]
  /** Los modelos que DE VERDAD corrieron (principal primero) y el principal
   *  juzgado (ADR-078, enmienda): lo que se asienta en la corrida. */
  readonly modelos?: readonly string[]
  readonly modelo?: string
  /** Rutas que el agente escribio. Nunca comandos: pueden llevar secretos. */
  readonly edits: readonly string[]
  /** La sesion que el CLI dice haber usado, SOLO si su evento final la trae. */
  readonly sessionId?: string
  /** Cuantos turnos del modelo corrio. 0 = no llego a empezar: una sesion asi no
   *  es una conversacion, y es la firma de un `--resume` que no encontro nada. */
  readonly turns?: number
}
