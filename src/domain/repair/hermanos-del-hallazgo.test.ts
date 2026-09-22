import { describe, expect, it } from 'vitest'
import { hermanosDelHallazgo } from './hermanos-del-hallazgo'
import { h, lineas, T } from './hermanos-del-hallazgo-fixture'

const EN_OTRO_SITIO = { file: 'supabase/migrations/x.sql', simbolo: 'policy', line: 103 }

describe('hermanosDelHallazgo: la sede antes que la clase (ADR-099)', () => {
  it('la misma sede se cita antes que la misma clase, y cada bloque dice lo que es', () => {
    const texto = hermanosDelHallazgo(T, [h('clase', EN_OTRO_SITIO), h('sede', { tipo: 'missing-run-guard' })]) ?? '' // prettier-ignore
    const l = lineas(texto)
    expect(l.findIndex((x) => x.includes('MISMA SEDE'))).toBeLessThan(l.findIndex((x) => x.includes('MISMA CLASE'))) // prettier-ignore
    expect(l.findIndex((x) => x.includes('t-sede'))).toBeLessThan(l.findIndex((x) => x.includes('t-clase'))) // prettier-ignore
    expect(texto).toContain('candidatos a ser el MISMO defecto')
    expect(texto).toContain('probablemente defectos distintos')
  })

  it("'otro' no agrupa por clase: ni recibe ni se cita; pero si entra en la sede", () => {
    const otroLejos = h('x', { ...EN_OTRO_SITIO, tipo: 'otro' })
    expect(hermanosDelHallazgo({ ...T, tipo: 'otro' }, [otroLejos])).toBeNull()
    expect(hermanosDelHallazgo(T, [otroLejos])).toBeNull()
    expect(hermanosDelHallazgo(T, [h('z', { tipo: 'otro' })])).toContain('t-z')
  })

  it('el simbolo decide la sede: otro simbolo y lejos en el mismo fichero es clase, no sede', () => {
    const texto = hermanosDelHallazgo(T, [h('lejos', { simbolo: 'verifyAdmin', line: 40 })]) ?? ''
    expect(texto).toContain('MISMA CLASE')
    expect(texto).not.toContain('MISMA SEDE')
    expect(hermanosDelHallazgo(T, [h('may', { simbolo: ' Handler', line: 40, tipo: 'otro' })])).toContain('MISMA SEDE') // prettier-ignore
  })

  it('sin simbolo decide la distancia: a 3 lineas es sede, a 4 ya no', () => {
    expect(hermanosDelHallazgo(T, [h('cerca', { simbolo: null, line: 261, tipo: 'otro' })])).toContain('MISMA SEDE') // prettier-ignore
    expect(
      hermanosDelHallazgo(T, [h('lejos', { simbolo: null, line: 262, tipo: 'otro' })])
    ).toBeNull()
  })
})
