import { observacionDeFallo, type OperacionDeFallo } from '@domain/system/observacion-de-fallo'
import { conRed, nombreDelError, type SumideroDeFallos } from './red-del-embudo'

export type { SumideroDeFallos }

/** Lo minimo de `process` que hace falta. Tipar el emisor, y no importar
 *  `process`, es lo que deja el embudo verificable en una prueba. */
export interface Emisor {
  on(evento: string, manejador: (error: unknown) => void): unknown
}

export const EVENTOS_DEL_EMBUDO = ['uncaughtException', 'unhandledRejection'] as const

/** Captura UN fallo del arranque por sus dos salidas. La red —el candado de
 *  reentrada, el orden log-antes-que-base y el tragar— vive en `conRed`, que
 *  comparten los embudos del Nivel 2. */
export function capturarFallo(
  sumidero: SumideroDeFallos,
  operacion: OperacionDeFallo,
  error: unknown
): void {
  conRed(sumidero, operacion, observacionDeFallo(operacion, nombreDelError(error)), error)
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
