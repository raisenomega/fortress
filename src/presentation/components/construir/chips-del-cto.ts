import type { FaseDelTurno } from '@domain/chat/fase-del-turno'

export interface ChipDeFase {
  readonly fase: FaseDelTurno
  readonly etiqueta: string
  readonly hecha: boolean
}

const CHIPS: readonly { fase: FaseDelTurno; etiqueta: string }[] = [
  { fase: 'contexto', etiqueta: 'contexto' },
  { fase: 'bloque', etiqueta: 'bloque' }
]

/** Los chips del progreso del CTO: contexto·bloque, en orden fijo, cada uno
 *  hecho o pendiente segun si su fase ya llego (PASO 158). */
export function chipsDelCto(hechas: readonly FaseDelTurno[]): readonly ChipDeFase[] {
  return CHIPS.map((c) => ({ ...c, hecha: hechas.includes(c.fase) }))
}
