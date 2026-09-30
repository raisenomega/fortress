import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Todo lo que sale EN VIVO a la pantalla pasa por el tachado.
 *
 * El chat quedo cubierto anoche envolviendo su callback en `sendMessage`. No
 * bastaba: cada canal tiene su PROPIO emisor y aquel no llegaba a ninguno de
 * los otros. El escaner nombro el del escaneo; al barrer aparecieron el del
 * grafo, el del bucle y el de la salida del login —que era ademas un hallazgo
 * abierto por su cuenta—. Cinco puertas, cuatro sin tachar.
 *
 * Se separa el TEXTO LIBRE de lo estructurado, y esa distincion es la que hace
 * la regla usable: `loop:status`, `repair:changed` o el progreso del chat llevan
 * numeros, ids y estados, y exigirles un tachado seria ruido que acaba
 * desactivando la prueba. Lo que se mira es quien emite una cadena que escribio
 * un agente o un proceso hijo.
 *
 * El del chat se envuelve tambien en su puerta aunque `sendMessage` ya lo
 * envuelva: tachar es idempotente, y si no, este seria el unico emisor con una
 * excepcion que explicar cada vez que alguien lea esta lista.
 */
const EMITE = /\b(?:sender|webContents)\.send\(/
const TEXTO_LIBRE = /\b(?:delta|text):\s*string\b/
const TACHA = /redactSecrets|sinSecretosEnVivo/

const ficheros = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((entrada) => {
    const ruta = join(dir, entrada)
    if (statSync(ruta).isDirectory()) return ficheros(ruta)
    return ruta.endsWith('.ts') && !/\.test\.ts$|fixture|fake/.test(ruta) ? [ruta] : []
  })

const emisores = ficheros('src')
  .map((ruta) => ({ ruta, texto: readFileSync(ruta, 'utf8') }))
  .filter((f) => EMITE.test(f.texto))

const conTextoLibre = emisores.filter((f) => TEXTO_LIBRE.test(f.texto))

describe('ningun emisor en vivo manda texto de agente sin tachar', () => {
  it('el barrido encuentra emisores de los dos tipos', () => {
    expect(emisores.length).toBeGreaterThan(5)
    // Cuatro desde ADR-107: el emisor del loop se fue con el loop.
    expect(conTextoLibre.length).toBeGreaterThanOrEqual(4)
  })

  it.each(conTextoLibre.map((f) => f.ruta))('%s tacha lo que emite', (ruta) => {
    // Si esto falla, la respuesta es envolver ESE emisor con `sinSecretosEnVivo`.
    // No relajar la regla ni mover el tachado aguas arriba: quien emite se tapa.
    const texto = readFileSync(ruta, 'utf8')

    expect({ ruta, tacha: TACHA.test(texto) }).toEqual({ ruta, tacha: true })
  })
})
