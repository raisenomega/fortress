import type { HallazgoAResolver } from '@domain/chat/hallazgo-a-resolver'
import type { RedDeReversion, TrabajoDelTurno } from '@domain/chat/red-de-reversion'
import type { VeredictoDelTurno } from '@domain/chat/veredicto-del-turno'
import type { JuezDelTurno } from './juez-del-turno'
import type { Reintento } from './ciclo-de-convergencia'
import { textOnly, type ReplyOutcome } from './reply-outcome'

export const FOCO: HallazgoAResolver = {
  id: 'f1',
  severity: 'HIGH',
  title: 'falta Content-Security-Policy',
  file: 'src/index.html',
  line: 3,
  tipo: null,
  simbolo: null,
  mitigatedNote: null,
  verificacionNote: null,
  sesion: 'ses-0'
}

const TRABAJO: TrabajoDelTurno = {
  diffText: 'd',
  tocados: ['src/index.html'],
  previo: () => 'antes',
  actual: () => 'despues'
}

/** Registra que se conservo y que se revirtio, para poder afirmarlo. */
export function redDeMentira(verde = true): RedDeReversion & { pasos: string[] } {
  const pasos: string[] = []
  return {
    pasos,
    disponible: () => true,
    verificar: () => Promise.resolve(verde),
    abrir: () => ({
      conservar: () => (pasos.push('conservar'), true),
      revertir: () => (pasos.push('revertir'), true),
      diff: () => TRABAJO
    })
  }
}

/** Un productor que edita y deja constancia del prompt y la sesion de CADA intento. */
export function productorDeMentira(sesiones: readonly string[]): {
  readonly producir: (r: Reintento | null) => Promise<ReplyOutcome>
  readonly intentos: Reintento[]
  readonly primero: () => boolean
} {
  const intentos: Reintento[] = []
  let n = 0
  return {
    intentos,
    primero: () => n === 1,
    producir: (r) => {
      if (r !== null) intentos.push(r)
      const sesion = sesiones[n] ?? sesiones[sesiones.length - 1]
      n += 1
      return Promise.resolve({ ...textOnly('hecho'), edits: ['src/index.html'], sesion })
    }
  }
}

/** Un juez guionizado: da un veredicto por intento, en orden. */
export function juezDeMentira(guion: readonly VeredictoDelTurno[]): JuezDelTurno {
  let n = 0
  return () => Promise.resolve(guion[n++] ?? guion[guion.length - 1])
}

export const APRUEBA: VeredictoDelTurno = { juzgado: true, aprobado: true }

/** Un veto con su huella: dos vetos con la MISMA huella son el mismo intento. */
export const VETA = (huella: string, razon = 'la CSP sigue permitiendo inline'): VeredictoDelTurno =>
  ({ juzgado: true, aprobado: false, razon, huella }) // prettier-ignore
