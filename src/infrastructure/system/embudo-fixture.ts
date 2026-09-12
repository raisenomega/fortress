import type { Emisor, SumideroDeFallos } from './embudo-de-arranque'
import type { SelfNoteDraft } from '@domain/system/self-observation'

export interface Banco {
  readonly sumidero: SumideroDeFallos
  readonly notas: SelfNoteDraft[]
  readonly log: Array<{ operacion: string; error: unknown }>
}

/** Las dos salidas del embudo, de mentira. `alAsentar` deja simular lo unico
 *  que de verdad puede pasar ahi: que asentar lance porque la base no abre. */
export function banco(alAsentar?: () => void): Banco {
  const notas: SelfNoteDraft[] = []
  const log: Array<{ operacion: string; error: unknown }> = []
  return {
    notas,
    log,
    sumidero: {
      asentar: (nota) => (alAsentar ? alAsentar() : void notas.push(nota)),
      registrar: (operacion, error) => void log.push({ operacion, error })
    }
  }
}

export interface EmisorFalso {
  readonly emisor: Emisor
  readonly eventos: string[]
  readonly disparar: (evento: string, error: unknown) => void
}

/** Un `process` de mentira que apunta a QUE eventos se engancho: la lista es la
 *  prueba de que no entra nada mas que lo inesperado. */
export function emisorFalso(): EmisorFalso {
  const manejadores = new Map<string, (error: unknown) => void>()
  const eventos: string[] = []
  return {
    eventos,
    emisor: {
      on: (evento, manejador) => {
        eventos.push(evento)
        manejadores.set(evento, manejador)
      }
    },
    disparar: (evento, error) => manejadores.get(evento)?.(error)
  }
}
