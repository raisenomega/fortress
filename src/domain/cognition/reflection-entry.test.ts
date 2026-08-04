import { describe, expect, it } from 'vitest'
import { EMPTY_COUNTS, countFindings } from '../project/severity-counts'
import { parseCognitionLog } from './parse-cognition-log'
import { buildReflectionEntry, cognitionBaseline } from './reflection-entry'

const at = '2026-08-03T10:00:00.000Z'

describe('buildReflectionEntry + el parser del panel (round-trip)', () => {
  it('lo que FORTRESS escribe, el panel lo lee como reflexion', () => {
    // El bucle completo: si el formato de escritura no casara con el de lectura,
    // el panel seguiria vacio aunque FORTRESS escribiera. Esto lo garantiza.
    const counts = countFindings([{ severity: 'CRITICAL' }, { severity: 'LOW' }])
    const doc = cognitionBaseline('Nucleo') + buildReflectionEntry('Nucleo', at, 42, counts)

    const snapshot = parseCognitionLog(doc)
    expect(snapshot.present).toBe(true)
    expect(snapshot.generation).toBe(0)
    expect(snapshot.reflections[0]).toMatchObject({ session: '2026-08-03', project: 'Nucleo' })
    expect(snapshot.reflections[0].body).toContain('1 CRITICAL')
    expect(snapshot.reflections[0].body).toContain('Score 42')
  })

  it('un escaneo limpio tambien deja constancia', () => {
    const doc = cognitionBaseline('Wudi') + buildReflectionEntry('Wudi', at, 100, EMPTY_COUNTS)
    const snapshot = parseCognitionLog(doc)
    expect(snapshot.reflections[0].body).toContain('sin hallazgos')
  })

  it('varios escaneos se acumulan, no se pisan', () => {
    const doc =
      cognitionBaseline('Nucleo') +
      buildReflectionEntry('Nucleo', '2026-08-01T00:00:00Z', 90, EMPTY_COUNTS) +
      buildReflectionEntry('Nucleo', '2026-08-02T00:00:00Z', 80, EMPTY_COUNTS)
    expect(parseCognitionLog(doc).reflections).toHaveLength(2)
  })
})
