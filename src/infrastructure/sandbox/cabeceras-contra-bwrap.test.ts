import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { olvidarSonda } from './sonda-de-bwrap'
import { corre, escenario } from './fuga-fixture'

/** ADR-108 contra el bwrap REAL de esta maquina, sin dobles. */
const e = escenario()
afterEach(olvidarSonda)
afterAll(limpiarCarpetasDePrueba)

describe('las cabeceras en la caja, contra bwrap de verdad (ADR-108)', () => {
  /**
   * ADR-108, las dos casillas que la firma exige contra bwrap DE VERDAD.
   *
   * El tmpfs crea el `~/.cache` intermedio VACIO y solo `node-gyp` se monta
   * encima: el resto de la cache del operador —`.npm` con su token incluido— no
   * asoma. Y escribir en las cabeceras se NIEGA: con montaje escribible, un
   * proceso de la caja de un CLIENTE envenenaria la cache que despues compila
   * el modulo nativo de FORTRESS.
   */
  it('de ~/.cache solo asoma node-gyp, y las cabeceras no se dejan escribir', async () => {
    const salida = await corre(e, ['fuga.js'])
    const cache = (salida['cache'] ?? '').replace(/^OK:/, '').split(',').filter((x) => x !== '') // prettier-ignore

    expect(cache).toEqual(['node-gyp'])
    expect(salida['cabeceras']).toBe('NO:EROFS')
  })
})
