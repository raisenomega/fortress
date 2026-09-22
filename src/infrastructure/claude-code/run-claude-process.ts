import type { ChildProcessWithoutNullStreams } from 'child_process'
import { createInterface } from 'readline'
import type { CodeAgentReply } from '@domain/chat/code-agent'
import { createRunAccumulator } from './run-accumulator'

/**
 * Lo que espera un camino SIN otra red que el reloj: Build, Genesis, el borrador
 * de agente y los episodios. Ahi un proceso colgado no tiene manifiesto que lo
 * mida ni barra de paradas que delate que no avanza, y el cronometro es lo unico
 * que hay. El Terminal ya no esta en esta lista: va sin techo, como el escaneo
 * (ADR-088, pieza 1; ADR-082, Enmienda 4).
 */
export const TECHO_POR_DEFECTO = 15 * 60 * 1000

/**
 * Sin techo. Lo piden los dos caminos de grado bancario, y los dos tienen otra
 * red que el reloj:
 * - el ESCANEO (ADR-082, Enmienda 3): el manifiesto mide y las paradas son
 *   finitas por construccion;
 * - el TERMINAL del cliente (ADR-088, pieza 1; ADR-082, Enmienda 4): se ve
 *   avanzar en vivo y el operador esta delante.
 * En los dos, el boton Detener escala a SIGKILL —que no se ignora— mientras el
 * reloj solo mandaba SIGTERM, una peticion que un proceso de verdad colgado se
 * salta.
 *
 * El techo no distinguia un cuelgue de una parada grande porque no sabe nada
 * del codigo. Medido el 2026-09-10: Health Flow murio en su PRIMERA parada a
 * los 901.727 ms con un hallazgo real a medias.
 */
export const SIN_TECHO = 0

/** Arma el techo y devuelve como desarmarlo. Sin techo no hay nada que armar ni
 *  que cancelar: la funcion vacia es la ausencia, no un caso especial. */
function armarTecho(child: ChildProcessWithoutNullStreams, techoMs: number): () => void {
  if (techoMs <= 0) return () => undefined

  const timer = setTimeout(() => child.kill('SIGTERM'), techoMs)
  return () => clearTimeout(timer)
}

/** Consume la salida NDJSON del CLI y resuelve al cerrarse el proceso. */
/** La respuesta de un turno que NO se lanzo: el mismo camino que un CLI que
 *  no arranca, con el motivo en stderr. Sin caja (ADR-092) se responde asi. */
export function sinLanzar(motivo: string, onChunk: (delta: string) => void): CodeAgentReply {
  const accumulator = createRunAccumulator(onChunk)
  accumulator.addStderr(`No se pudo ejecutar Claude Code: ${motivo}`)
  return accumulator.toReply(null)
}

export function collectRun(
  child: ChildProcessWithoutNullStreams,
  onChunk: (delta: string) => void,
  /** Default: el de siempre. Quien no pasa nada se comporta como antes. */
  techoMs: number = TECHO_POR_DEFECTO
): Promise<CodeAgentReply> {
  return new Promise((resolve) => {
    const accumulator = createRunAccumulator(onChunk)
    const desarmar = armarTecho(child, techoMs)

    createInterface({ input: child.stdout }).on('line', (line) => accumulator.absorb(line))
    child.stderr.on('data', (chunk: Buffer) => accumulator.addStderr(chunk.toString()))

    child.on('error', (error) => {
      desarmar()
      accumulator.addStderr(`No se pudo ejecutar Claude Code: ${error.message}`)
      resolve(accumulator.toReply(null))
    })

    child.on('close', (code) => {
      desarmar()
      resolve(accumulator.toReply(code))
    })
  })
}
