import { observacionDeFallo, type OperacionDeFallo } from '@domain/system/observacion-de-fallo'
import type { SelfNoteDraft } from '@domain/system/self-observation'

/** Las dos salidas de un fallo: la que VIAJA (la clase) y la que se queda (el
 *  error entero). Inyectadas para que el embudo se pruebe sin Electron ni base. */
export interface SumideroDeFallos {
  readonly asentar: (nota: SelfNoteDraft) => void
  readonly registrar: (operacion: OperacionDeFallo, error: unknown) => void
}

/** Lo minimo de `process` que hace falta. Tipar el emisor, y no importar
 *  `process`, es lo que deja el embudo verificable en una prueba. */
export interface Emisor {
  on(evento: string, manejador: (error: unknown) => void): unknown
}

export const EVENTOS_DEL_EMBUDO = ['uncaughtException', 'unhandledRejection'] as const

let dentro = false

/**
 * Captura UN fallo inesperado por sus dos salidas.
 *
 * El candado no es paranoia: esto corre dentro del manejador de un fallo, y
 * asentar la observacion abre la base. Si abrir la base es LO QUE FALLO,
 * asentar volveria a lanzar, el nuevo `uncaughtException` entraria aqui otra
 * vez, y el arranque roto se convertiria en un bucle. Se registra primero —lo
 * barato y lo que nunca lanza— y se asienta despues, tragando el error: un
 * fallo no puede multiplicarse por el intento de anotarlo.
 */
export function capturarFallo(
  sumidero: SumideroDeFallos,
  operacion: OperacionDeFallo,
  error: unknown
): void {
  if (dentro) return
  dentro = true
  try {
    sumidero.registrar(operacion, error)
    sumidero.asentar(observacionDeFallo(operacion, (error as { name?: unknown })?.name))
  } catch {
    // El fallo original ya esta en el log. Perder su observacion no lo empeora.
  } finally {
    dentro = false
  }
}

/**
 * El embudo del proceso principal (ADR-086, embudo 1). Escucha SOLO lo
 * inesperado: un `throw` que nadie atrapo y una promesa rechazada. Los `err()`
 * —156 en el codigo— no pasan por aqui y no deben: son valores que alguien
 * maneja, la app funcionando, y capturarlos llenaria el backlog de uso normal.
 *
 * NO cambia lo que pasa despues, y eso se midio en vez de suponerlo:
 * `uncaughtException` ya tenia UN oyente antes de esto —el dialogo de error de
 * Electron—, asi que el proceso ya no moria por defecto y sumar otro es
 * aditivo. Y `unhandledRejection` no tenia ninguno: Electron corre en modo
 * `warn`, de modo que hoy la app SIGUE VIVA a medio arrancar y solo deja un
 * aviso en un stderr que en un AppImage no lee nadie. Escucharlo no le quita
 * nada a nadie; le anade el unico rastro que habia.
 */
export function instalarEmbudoDeArranque(emisor: Emisor, sumidero: SumideroDeFallos): void {
  emisor.on(EVENTOS_DEL_EMBUDO[0], (error) =>
    capturarFallo(sumidero, 'una excepcion sin capturar', error)
  )
  emisor.on(EVENTOS_DEL_EMBUDO[1], (error) =>
    capturarFallo(sumidero, 'una promesa rechazada sin manejar', error)
  )
}
