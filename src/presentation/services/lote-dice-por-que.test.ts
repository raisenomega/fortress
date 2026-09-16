import { describe, expect, it } from 'vitest'
import type { SinCierre } from '@domain/chat/motivo-sin-cierre'
import { banco, fila } from './cola-del-lote-fixture'
import { correrLote } from './cola-del-lote'

const SIN_EDICIONES: SinCierre = { motivo: 'sin-ediciones', edits: { porNombre: 2, porRuta: 0 } }

/**
 * El parte del lote deja de agrupar tres causas en una frase. Antes decia
 * «no cerraron (degradaron, revirtieron o sin cambios)» y habia que rastrear la
 * base a mano para saber cual de las tres fue.
 */
describe('el parte del lote dice POR QUE no cerro', () => {
  it('nombra la guarda y las dos cuentas de edits', async () => {
    const b = banco({ tabla: [fila('f1')], sinCierre: () => SIN_EDICIONES })

    await correrLote('p1', ['f1'], b.p)

    expect(b.resumenes[0]).toContain('1 no cerraron')
    expect(b.resumenes[0]).toContain('Sin cerrar por: sin-ediciones (edits 2 vs 0)')
  })

  it('cuando las dos cuentas coinciden no repite el numero', async () => {
    const vacio: SinCierre = { motivo: 'sin-ediciones', edits: { porNombre: 0, porRuta: 0 } }
    const b = banco({ tabla: [fila('f1')], sinCierre: () => vacio })

    await correrLote('p1', ['f1'], b.p)

    expect(b.resumenes[0]).toContain('sin-ediciones (0 edits)')
  })

  it('agrupa los que cortaron por lo mismo, sin repetir la linea', async () => {
    const b = banco({ tabla: [fila('f1'), fila('f2')], sinCierre: () => SIN_EDICIONES })

    await correrLote('p1', ['f1', 'f2'], b.p)

    expect(b.resumenes[0]).toContain('sin-ediciones (edits 2 vs 0) ×2')
  })

  it('sin motivo registrado, el parte queda como estaba: nada que explicar', async () => {
    const b = banco({ tabla: [fila('f1')] })

    await correrLote('p1', ['f1'], b.p)

    expect(b.resumenes[0]).toContain('1 no cerraron')
    expect(b.resumenes[0]).not.toContain('Sin cerrar por')
  })
})
