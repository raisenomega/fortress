import { describe, expect, it } from 'vitest'
import type { FaseDelTurno } from '@domain/chat/fase-del-turno'
import { tejerFasesDelCto } from './progreso-del-cto'

/** PASO 158: las dos fases del CTO sobre el stream — 'contexto' al reunir los
 *  marcos; 'bloque' en el PRIMER delta de texto (una sola vez). Puro, sin CLI. */

describe('tejerFasesDelCto: contexto y bloque', () => {
  it('T1: contexto() emite la fase contexto', () => {
    const vistas: FaseDelTurno[] = []
    tejerFasesDelCto(
      (f) => vistas.push(f),
      () => {}
    ).contexto()
    expect(vistas).toEqual(['contexto'])
  })

  it('T2: bloque enciende en el PRIMER delta, una sola vez; antes NO, y el texto pasa', () => {
    const vistas: FaseDelTurno[] = []
    const pasados: string[] = []
    const { onChunk } = tejerFasesDelCto(
      (f) => vistas.push(f),
      (d) => pasados.push(d)
    )
    expect(vistas).toEqual([])
    onChunk('hola')
    onChunk(' mundo')
    expect(vistas).toEqual(['bloque'])
    expect(pasados).toEqual(['hola', ' mundo'])
  })
})
