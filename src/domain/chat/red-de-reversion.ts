import { medida, type MedidaDelArbol } from './medida-del-arbol'

/**
 * Lo que el agente dejo escrito en este turno, leido SIN saber que detras hay
 * git: el texto del diff, que ficheros toco, y como estaba cada uno antes.
 * Es lo que un revisor necesita para juzgar el trabajo sin navegar el proyecto.
 */
export interface TrabajoDelTurno {
  readonly diffText: string
  readonly tocados: readonly string[]
  /** El contenido de un fichero ANTES del turno. Cadena vacia si no existia. */
  readonly previo: (relPath: string) => string
  /** Y como quedo DESPUES. Vacia si el turno lo borro. */
  readonly actual: (relPath: string) => string
}

/**
 * El checkpoint del ADR-079, sin saber que detras hay git. Tiene dos unicas
 * salidas, y las dos dicen si el commit quedo RETIRADO del historial: `false`
 * es un checkpoint huerfano en la rama del operador.
 */
export interface CheckpointDelTurno {
  /** Exito: el arbol se queda con las ediciones del agente. */
  conservar(): boolean
  /** Fallo: las ediciones se descartan y el arbol vuelve a como estaba. */
  revertir(): boolean
  /**
   * Lo editado hasta ahora, para juzgarlo ANTES de conservarlo (ADR-090, Fase
   * A). `null` si no se pudo leer, y entonces decide el gate: no se inventa un
   * veredicto. Opcional porque una red de mentira no tiene diff que ensenar.
   */
  diff?(): TrabajoDelTurno | null
}

export interface RedDeReversion {
  /** Si `abrir` tendria red: raiz de repo git con historia. Sin efectos, para
   *  decidir el modo ANTES de abrir nada; es la senal que degrada a supervisado. */
  readonly disponible: (cwd: string) => boolean
  /** null = no hay red posible: sin git, sin raiz de repo, o sin commits. */
  readonly abrir: (cwd: string) => CheckpointDelTurno | null
  /** El gate tras el turno: como quedo el arbol y, si no se pudo medir, POR QUE. */
  readonly verificar: (cwd: string) => Promise<MedidaDelArbol>
}

/** Sin red: lo que hay cuando nadie la inyecta. `disponible` en false degrada. */
export const SIN_RED: RedDeReversion = {
  disponible: () => false,
  abrir: () => null,
  verificar: () => Promise.resolve(medida('verde'))
}

export { REVERTIDO_POR_RED, SIN_RED_NO_SE_EDITA, CHECKPOINT_HUERFANO } from './textos-de-la-red'
