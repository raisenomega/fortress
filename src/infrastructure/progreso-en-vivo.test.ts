import { describe, expect, it } from 'vitest'
import { sinSecretosEnVivo } from '@application/chat/en-vivo-tachado'

/** Lo que cada emisor hace: envolver su propia salida antes de mandarla. */
function pantalla(): { emitir: (d: string) => void; visto: () => string } {
  let visto = ''
  return { emitir: sinSecretosEnVivo((d) => (visto += d)), visto: () => visto }
}

const TOKEN = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345'

describe('lo que se pinta en vivo no lleva secretos', () => {
  it('el progreso del escaneo: un token citado del repo no llega crudo', () => {
    const p = pantalla()
    p.emitir(`Leyendo .env: encontrada ${TOKEN}\n`)

    expect(p.visto()).not.toContain(TOKEN)
    expect(p.visto()).toContain('Leyendo .env')
  })

  it('la salida del login: el proceso corre con la sesion viva del operador', () => {
    const p = pantalla()
    p.emitir('Guardando credencial: sk-ant-api03-QQQQQQQQQQ\n')

    expect(p.visto()).not.toContain('sk-ant-api03-QQQQQQQQQQ')
  })
})

describe('y el progreso legitimo queda INTACTO', () => {
  it('rutas, contadores y titulos de hallazgo pasan enteros', () => {
    // Tachar de mas deja al operador mirando un progreso ilegible, que es peor
    // que no tacharlo: dejaria de leerlo.
    const linea =
      'src/domain/repair/allowed-files.ts:59 — HIGH: la correa admite .mcp.json ' +
      '(3/14 ficheros, 2 monkey=banana, keyboard=usb)'
    const p = pantalla()
    p.emitir(linea)

    expect(p.visto()).toBe(linea)
  })

  it('el nombre de una herramienta del grafo no se confunde con un secreto', () => {
    const p = pantalla()
    p.emitir('· search_graph: symbol=guardRun kind=function\n')

    expect(p.visto()).toContain('symbol=guardRun')
  })
})
