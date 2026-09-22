import { describe, expect, it } from 'vitest'
import { hermanosDelHallazgo } from './hermanos-del-hallazgo'
import { h, lineas, T } from './hermanos-del-hallazgo-fixture'

const citados = (texto: string | null): string[] =>
  lineas(texto)
    .filter((l) => l.includes(' — t-'))
    .map((l) => l.split(' — t-')[1] ?? '')

describe('hermanosDelHallazgo: cita 5, los relevantes y no los mas graves (ADR-099)', () => {
  it('la sede llena primero, el mas cercano antes; la clase, lo que quede, en su orden de urgencia', () => {
    // La entrada llega por urgencia: los seis de la clase, mas graves, van delante.
    const clase = Array.from({ length: 6 }, (_, i) => h(`c${i}`, { file: `otro${i}.ts`, simbolo: 'x', line: 1 })) // prettier-ignore
    const sede = [h('s10', { line: 268, tipo: 'otro' }), h('s0', { line: 258, tipo: 'validacion-asimetrica' }), h('s3', { line: 255, tipo: 'tope-no-consultado' })] // prettier-ignore
    const texto = hermanosDelHallazgo(T, [...clase, ...sede])
    expect(citados(texto)).toEqual(['s0', 's3', 's10', 'c0', 'c1'])
    expect(texto).toContain('(y 4 mas de la clase)')
    expect(texto).not.toContain('mas de la sede')
  })

  it('a igual distancia, el mas antiguo primero; en la clase, los del mismo fichero antes', () => {
    const sede = [h('nuevo', { line: 260, firstSeen: '2026-09-08' }), h('viejo', { line: 260, firstSeen: '2026-08-04' })] // prettier-ignore
    expect(citados(hermanosDelHallazgo(T, sede))).toEqual(['viejo', 'nuevo'])
    const clase = [
      h('fuera', { file: 'z.ts', simbolo: 'z' }),
      h('dentro', { simbolo: 'verifyAdmin', line: 40 })
    ]
    expect(citados(hermanosDelHallazgo(T, clase))).toEqual(['dentro', 'fuera'])
  })

  it('no se cita a si mismo, y le dice que NO los arregle ni los cite como where', () => {
    expect(hermanosDelHallazgo(T, [h('f1')])).toBeNull()
    expect(hermanosDelHallazgo(T, [h('a')])).toContain('NO los arregles ni los cites como where')
  })

  it('sin nada relacionado no dice nada; sin clase (formato viejo) queda la sede', () => {
    expect(hermanosDelHallazgo(T, [h('ajeno', { file: 'z.ts', simbolo: 'z', tipo: 'path-traversal' })])).toBeNull() // prettier-ignore
    expect(hermanosDelHallazgo({ ...T, tipo: null }, [h('sede')])).toContain('MISMA SEDE')
  })
})
