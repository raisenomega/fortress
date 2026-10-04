import type { Writable } from 'stream'

/**
 * ADR-112: el prompt viaja por STDIN, nunca por argv. Los limites del SO son
 * del argv (Linux 128 KiB POR ARGUMENTO —el E2BIG del lock—, Windows 32.767
 * caracteres TOTALES: el expediente normal ya no cabia alli), y FORTRESS se
 * distribuye a las tres plataformas. `claude -p` sin positional lee stdin
 * (verificado en vivo), y bwrap hereda los descriptores: la caja no lo corta
 * (medido con 200 KB a traves del bwrap real).
 */
export interface ConPrompt {
  /** Los flags de siempre, con `-p` SIN valor. Caben en Windows por diseno. */
  readonly args: readonly string[]
  readonly prompt: string
}

/** Escribir y CERRAR: sin el `end`, el CLI espera un EOF que no llega y el
 *  timeout del spawn mataria una corrida que nunca empezo a pensar. Tolera un
 *  stdin ausente (stdio 'ignore', o un doble de spawn sin tuberia): escribir
 *  el prompt es del transporte, y el transporte no decide si el hijo escucha. */
export function escribirPrompt(stdin: Writable | null | undefined, prompt: string): void {
  if (stdin === null || stdin === undefined) return
  // El hijo puede morir ANTES del write (un binario que revienta al cargar, un
  // doble de spawn que sale al instante): ese EPIPE no es un fallo del
  // transporte y no puede tumbar a nadie — el 'close' del hijo ya cuenta el
  // desenlace por su via. Tragar SOLO aqui; el resto de errores siguen suyos.
  stdin.on('error', () => undefined)
  try {
    stdin.write(prompt)
    stdin.end()
  } catch {
    // destino muerto: mismo caso que el EPIPE asincrono de arriba.
  }
}
