import { afterAll, describe, expect, it } from 'vitest'
import { contextoConDosProyectos } from './rebanada-fixture'
import { rebanadaDelLibro } from './rebanada-del-libro'

/**
 * EL TEST SAGRADO del aislamiento (vision §5, Sello B.1): un turno de CTO
 * anclado a B JAMAS ve un hallazgo, asiento, evento, patron ni doc de A.
 * Nacio ROJO (el ensamblador no existia) y es la custodia, no una promesa.
 */

const fx = contextoConDosProyectos()
afterAll(() => fx.limpiar())

const textoDe = async (id: string): Promise<string> =>
  (await rebanadaDelLibro(fx.ctx, id)).map((m) => `${m.nombre}\n${m.texto}`).join('\n')

const FUENTES_DE_B = [
  'vivo-BETA', // findings vivos
  'extinto-BETA', // historia
  'asiento-BETA', // libro de la vida (omega)
  'hallazgo-BETA', // propuestas del motor
  'patron-BETA', // cognicion
  'INFORME-BETA' // docs del proyecto
]

describe('LA CUSTODIA: la rebanada de B jamas ve a A', () => {
  it('las SEIS fuentes de B llegan y NINGUNA marca de A se cuela', async () => {
    const b = await textoDe('b1')
    for (const fuente of FUENTES_DE_B) expect(b).toContain(fuente)
    expect(b).not.toContain('ALFA')
  })

  it('y al reves: la rebanada de A no ve nada de B', async () => {
    const a = await textoDe('a1')
    expect(a).toContain('vivo-ALFA')
    expect(a).not.toContain('BETA')
  })

  it('proyecto ausente: rebanada VACIA, nunca la de otro', async () => {
    expect(await rebanadaDelLibro(fx.ctx, 'nadie')).toEqual([])
  })
})
