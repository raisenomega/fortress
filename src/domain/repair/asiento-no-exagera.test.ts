import { describe, expect, it } from 'vitest'
import { asientoRojo, asientoVerde, SIN_MEDIR, type MedidaDelArbol } from './asiento-de-la-medida'
import { GATE_COMMANDS } from './gate-config'

const medida = (comandos: readonly string[], ok = true): MedidaDelArbol => ({ ok, comandos, detalle: '' }) // prettier-ignore
const CLAVES = GATE_COMMANDS.map((c) => c.key)

describe('el asiento no puede prometer mas de lo que se midio', () => {
  it('nombra los comandos que corrieron, y por que ficheros se midio', () => {
    const texto = asientoVerde(medida(['typecheck', 'lint']), ['src/a.ts'])

    expect(texto).toContain('typecheck + lint')
    expect(texto).toContain('src/a.ts')
  })

  it('si solo corrio uno, no dice tres', () => {
    // El proyecto auditado puede no tener los tres scripts: el gate se salta lo
    // que no sabe correr. El asiento tiene que encogerse con el.
    expect(asientoVerde(medida(['typecheck']), ['src/a.ts'])).not.toContain('test:unit')
  })

  it('DERIVADO: el gate completo nombra exactamente los comandos que el motor corre', () => {
    // Ninguna de estas frases escribe un nombre de comando. Si alguien anade un
    // cuarto al gate, el asiento lo nombra solo; si lo quita, deja de nombrarlo.
    const texto = asientoVerde(medida(CLAVES), ['src/a.ts'])

    for (const clave of CLAVES) expect(texto).toContain(clave)
  })

  it('DERIVADO: nunca nombra lo que el gate del motor NO mide', () => {
    // El gate humano son cinco fases; el del motor, tres. Un asiento que
    // nombrara las otras dos daria por mirado lo que nadie miro, y una
    // verificacion que exagera su alcance es peor que no tenerla.
    const texto = `${asientoVerde(medida(CLAVES), ['src/a.ts'])} ${asientoRojo(medida(CLAVES, false))}` // prettier-ignore

    for (const ajena of ['integration', 'migration', 'smoke', 'e2e', 'preview']) {
      expect(texto).not.toContain(ajena)
    }
  })
})

describe('el asiento de lo que no salio bien', () => {
  it('el rojo dice cual rompio y cuales iban verdes', () => {
    const texto = asientoRojo(medida(['typecheck', 'lint', 'test:unit'], false))

    expect(texto).toContain('rojo en test:unit')
    expect(texto).toContain('verdes typecheck + lint')
  })

  it('sin un solo comando corrido no se disfraza de medida', () => {
    const texto = asientoRojo({ ok: false, comandos: [], detalle: 'choque textual con el destino' })

    expect(texto).toContain('sin medir')
    expect(texto).toContain('choque textual con el destino')
  })

  it('no haber medido tambien se cuenta, en vez de callarse', () => {
    expect(SIN_MEDIR).toContain('sin medir')
  })
})
