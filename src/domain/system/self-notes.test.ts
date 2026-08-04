import { describe, expect, it } from 'vitest'
import { parseSelfNotes } from './self-notes'

describe('parseSelfNotes', () => {
  it('extrae las notas de FORTRESS y las etiqueta con el proyecto origen', () => {
    const text =
      'Arregle lo del proyecto.\nFORTRESS-NOTES: [{"kind":"limitacion","area":"allowlist",' +
      '"note":"no pude correr npm run build para verificar el bundle"}]'
    const notes = parseSelfNotes(text, 'mailbd')
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({
      sourceProject: 'mailbd',
      kind: 'limitacion',
      area: 'allowlist'
    })
  })

  it('sin bloque FORTRESS-NOTES devuelve vacio (lo normal)', () => {
    expect(parseSelfNotes('Un informe cualquiera sin notas.', 'x')).toEqual([])
  })

  it('descarta items mal formados sin lanzar', () => {
    const text = 'FORTRESS-NOTES: [{"kind":"inventado","area":"a","note":"n"},{"area":"b"}]'
    expect(parseSelfNotes(text, 'x')).toEqual([])
  })

  it('un bloque JSON roto no rompe el ciclo', () => {
    expect(parseSelfNotes('FORTRESS-NOTES: [rompo esto', 'x')).toEqual([])
  })
})
