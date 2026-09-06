import { describe, expect, it } from 'vitest'
import { informeDeFusion, type FilaDelInforme } from './informe-de-fusion'
import { masUrgente, type Severity } from '../shared/severity'
import { planDeFusion } from './fusion-de-duplicados'

/** El informe recibe el plan y el comparador REALES: si un dia dejan de
 *  coincidir con lo que la fusion usa, estos casos se enteran. */
const informe = (filas: readonly FilaDelInforme[]): ReturnType<typeof informeDeFusion> =>
  informeDeFusion(filas, planDeFusion(filas), masUrgente)

const ID = 'supabase/functions/send-invoice/index.ts|missing-run-guard|handler'

// prettier-ignore
const fila = (id: string, firstSeen: string, severity: Severity, identidad = ID): FilaDelInforme =>
  ({ id, identidad, firstSeen, severity, title: `titulo de ${id}` })

describe('el informe dice lo que la fusion HARIA, sin hacerlo', () => {
  it('tres filas del mismo defecto: una sobrevive y dos quedan absorbidas', () => {
    const grupos = informe([
      fila('c', '2026-08-21', 'LOW'),
      fila('a', '2026-08-04', 'LOW'),
      fila('b', '2026-08-17', 'LOW')
    ])

    expect(grupos).toHaveLength(1)
    expect(grupos[0].superviviente.id).toBe('a')
    expect(grupos[0].absorbidas.map((f) => f.id).sort()).toEqual(['b', 'c'])
  })

  it('mismo fichero y mismo tipo, distinto simbolo: NO agrupa', () => {
    // La red contra la sobre-fusion: la clave es la identidad COMPLETA.
    const otro = 'supabase/functions/send-invoice/index.ts|missing-run-guard|verifyadmin'
    expect(informe([fila('a', '2026-08-04', 'LOW'), fila('b', '2026-08-17', 'LOW', otro)])) // prettier-ignore
      .toEqual([])
  })

  it('con severidades mixtas avisa: la fusion se llevaria la mas alta por delante', () => {
    // El caso de send-preorder:364 — gana la mas antigua, que es la mas suave.
    const grupos = informe([
      fila('a', '2026-08-04', 'MEDIUM'),
      fila('b', '2026-08-18', 'HIGH'),
      fila('c', '2026-09-06', 'HIGH')
    ])

    expect(grupos[0].severidadSuperviviente).toBe('MEDIUM')
    expect(grupos[0].severidadMaxima).toBe('HIGH')
    expect(grupos[0].discrepa).toBe(true)
  })

  it('sin severidades mixtas no avisa: el aviso solo suena cuando hay algo que perder', () => {
    const grupos = informe([fila('a', '2026-08-04', 'HIGH'), fila('b', '2026-08-18', 'HIGH')]) // prettier-ignore

    expect(grupos[0].discrepa).toBe(false)
    expect(grupos[0].severidadMaxima).toBe('HIGH')
  })
})
