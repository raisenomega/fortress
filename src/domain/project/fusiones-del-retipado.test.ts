import { describe, expect, it } from 'vitest'
import type { FilaAFusionar } from './fusion-de-duplicados'
import { fusionesDelRetipado } from './fusiones-del-retipado'
import type { Retipado } from './retipado-de-otros'

const CLAVE = 'supabase/functions/send-invoice/index.ts|268|rate-limit-ausente'
const viva = (id: string, identidad: string, firstSeen: string): FilaAFusionar => ({ id, identidad, firstSeen }) // prettier-ignore
// prettier-ignore
const retipada = (id: string, identidad_nueva = CLAVE): Retipado => ({ id, desenlace: 'retipada', tipo: 'rate-limit-ausente', identidad_nueva, razon: 'sigue sin tope' })

describe('fusionesDelRetipado: lo que quedaria repetido despues de re-tipar', () => {
  it('un otro que se vuelve el tipo de una viva en su misma sede se funde: gana la mas antigua', () => {
    const vivas = [viva('v', CLAVE, '2026-09-08'), viva('o', 'supabase/functions/send-invoice/index.ts|268|otro', '2026-09-07')] // prettier-ignore
    expect(fusionesDelRetipado(vivas, [retipada('o')])).toEqual([{ ganadora: 'o', absorbidas: ['v'], identidad: CLAVE }]) // prettier-ignore
  })

  it('la que sigue otro conserva su clave y no funde con nadie', () => {
    const vivas = [viva('v', CLAVE, '2026-09-08'), viva('o', 'x.ts|1|otro', '2026-09-07')]
    const sigue: Retipado = { id: 'o', desenlace: 'sigue_otro', razon: 'no encaja', nota: null }
    expect(fusionesDelRetipado(vivas, [sigue])).toEqual([])
  })

  it('dos otro que se vuelven el mismo tipo en lineas distintas son dos filas: no se funden', () => {
    const vivas = [viva('a', 'x.ts|1|otro', '2026-09-01'), viva('b', 'x.ts|9|otro', '2026-09-02')]
    expect(fusionesDelRetipado(vivas, [retipada('a', 'x.ts|1|accesibilidad'), retipada('b', 'x.ts|9|accesibilidad')])).toEqual([]) // prettier-ignore
  })

  it('una retipada que no esta entre las vivas es un fallo de cableado, no un dato', () => {
    expect(() => fusionesDelRetipado([viva('v', CLAVE, '2026-09-08')], [retipada('fantasma')])).toThrow('fantasma') // prettier-ignore
  })
})
