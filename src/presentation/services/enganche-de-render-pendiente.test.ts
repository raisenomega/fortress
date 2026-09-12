import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { AREAS_DE_FALLO } from '@domain/system/areas-de-fallo'

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

const MAIN = 'src/renderer/src/main.tsx'
const MANEJADOR = 'src/presentation/services/fallo-de-render.ts'

/**
 * El embudo 3 esta CONSTRUIDO Y DESCONECTADO, y eso se fija por lectura del
 * fuente porque las dos formas compilan: cablear el asiento es una linea, y
 * anadir el area es una palabra.
 *
 * Este test existe para que el dia que alguien haga LA MITAD —el area sin el
 * cable, o el cable sin la firma— se entere aqui y no en produccion.
 */
describe('el enganche del render sigue pendiente de firma', () => {
  it('el area NO nace hasta que nazca su emisor', () => {
    expect(AREAS_DE_FALLO).not.toContain('fallo-de-render')
    expect(AREAS_DE_FALLO).toContain('fallo-de-arranque')
    expect(AREAS_DE_FALLO).toContain('fallo-de-ipc')
  })

  it('y el renderer NO asienta: construye la nota y la deja', () => {
    // Por el IMPORT y no por el texto: `api()` aparece en el docblock del paso
    // (d), que es documentacion. Importar el adaptador del puente es lo unico
    // que de verdad cablearia el asiento.
    const PUENTE = 'adapters/fortress-api'
    expect(fuente(MANEJADOR)).not.toContain(`from '../${PUENTE}'`)
    expect(fuente(MANEJADOR)).not.toContain(`from '@presentation/${PUENTE}'`)
    expect(fuente(MAIN)).not.toContain(PUENTE)
  })

  it('el puente sigue sin el metodo que haria falta', () => {
    // `preload/index.ts` es INNEGOCIABLE: es la UNICA superficie que cruza el
    // aislamiento del renderer, y por eso el enganche pide firma.
    expect(fuente('src/preload/index.ts')).not.toContain('reportarFalloDeRender')
  })

  it('pero las dos mitades visibles SI estan puestas', () => {
    expect(fuente(MAIN)).toContain('onUncaughtError')
    expect(fuente(MAIN)).toContain('onCaughtError')
    expect(fuente(MAIN)).toContain('<ErrorBoundary>')
  })

  it('y los cuatro pasos de la firma estan escritos donde se van a leer', () => {
    for (const paso of ['(a)', '(b)', '(c)', '(d)', 'reportarFalloDeRender', 'INNEGOCIABLE']) {
      expect(fuente(MANEJADOR)).toContain(paso)
    }
  })
})
