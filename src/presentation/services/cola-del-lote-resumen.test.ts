import { describe, expect, it } from 'vitest'
import type { Finding } from '@domain/project/finding'
import { correrLote } from './cola-del-lote'
import { banco, fila } from './cola-del-lote-fixture'

const IDS = ['f1', 'f2', 'f3']

describe('al acabar, la cola cuenta los desenlaces en el Terminal', () => {
  it('uno a Historia, uno sin prueba, uno sin cerrar: el resumen system lo dice', async () => {
    const despues: Record<string, Finding | undefined> = {
      f1: undefined,
      f2: fila('f2', { lifecycle: 'MITIGATED', verificacionNote: 'sin prueba: no se pudo' }),
      f3: fila('f3')
    }
    const b = banco({ tras: (id) => despues[id] })

    expect(await correrLote('p1', IDS, b.p)).toEqual(['extinguido', 'sin_prueba', 'no_cerro'])
    expect(b.resumenes).toHaveLength(1)
    expect(b.resumenes[0]).toContain('3 de 3 procesados — 1 a Historia, 0 siguen activos')
    expect(b.resumenes[0]).toContain('1 sin prueba')
    expect(b.resumenes[0]).toContain('1 no cerraron')
  })

  it('el que ya no pide trabajo se omite sin mandarlo', async () => {
    const tabla = [
      fila('f1'),
      fila('f2', { lifecycle: 'MITIGATED' }),
      fila('f3', { status: 'false_positive' })
    ]
    const b = banco({ tabla })

    expect(await correrLote('p1', IDS, b.p)).toEqual(['no_cerro', 'omitido', 'omitido'])
    expect(b.enviados.map((i) => i.findingId)).toEqual(['f1'])
    expect(b.resumenes[0]).toContain('2 omitidos')
  })

  it('el resumen se cuenta una sola vez, tambien si la cola se corta', async () => {
    const b = banco({ detenerTras: 2 })
    await correrLote('p1', IDS, b.p)
    expect(b.resumenes).toHaveLength(1)
    expect(b.resumenes[0]).toContain('Cortado: 1 sin lanzar.')
  })
})
