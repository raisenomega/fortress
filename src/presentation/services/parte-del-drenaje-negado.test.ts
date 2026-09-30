import { describe, expect, it } from 'vitest'
import type { DrenajeResultado } from '@application/repair/drenar-hasta-omega'
import { parteDelDrenaje } from './parte-del-drenaje'

const CERO = {
  trabajadas: 0, acumuladas: 0, vetadas: 0, porPresupuesto: 0, porTimeout: 0, porCorrea: 0,
  porLimitePropio: 0, porEntornoDelProyecto: 0, porDefectoInterno: 0, superadas: 0, sinClasificar: 0
} // prettier-ignore

/**
 * El bloqueo del perimetro NO es agotar el pozo (ADR-107). Si comparten frase,
 * un drenaje negado entero se lee como una jornada de trabajo limpia.
 */
describe('el parte distingue el perimetro del pozo agotado', () => {
  it('un proyecto negado no se lee como pozo agotado', () => {
    const negado = parteDelDrenaje({ fin: 'negado', ...CERO } as DrenajeResultado)

    expect(negado.texto).toContain('Terminal')
    expect(negado.texto).not.toContain('no queda nada elegible')
    expect(negado.tono).toBe('aviso')
  })
})
