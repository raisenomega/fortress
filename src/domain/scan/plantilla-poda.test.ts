import { describe, expect, it } from 'vitest'
import { delKit, enCarpeta } from './plantilla-fixture'
import { cuerpoAccionable } from './plantilla-accionable'
import { resumenDeModulo } from './resumen-de-modulo'

const M8 = delKit('M8')
const cuerpo = cuerpoAccionable(M8.texto) ?? ''
const resumen = resumenDeModulo(M8, enCarpeta('src/api'), 'Proyecto') ?? ''

/** Lo que NO puede viajar, y por que cada cosa. */
const PODADO: ReadonlyArray<readonly [string, string]> = [
  ['**Entregable:**', 'pide ESCRIBIR un fichero'],
  ['{{OUTPUT_DIR}}', 'apunta a una carpeta de salida que no existe'],
  ['S0', 'trae su propio contrato de severidad'],
  ['Firma', 'cierra un informe que aqui no se escribe'],
  ['═══', 'delimitador del kit, no del prompt'],
  ['Cargá informes previos', 'apunta a un flujo que aqui no existe']
]

describe('la poda deja el cuerpo accionable y nada mas', () => {
  it.each(PODADO)('no viaja %s: %s', (trozo) => {
    expect(resumen).not.toContain(trozo)
  })

  it('el cuerpo A-I SI viaja entero', () => {
    for (const paso of ['**A.', '**B.', '**C.', '**D.', '**E.', '**F.', '**G.', '**H.', '**I.']) {
      expect(cuerpo).toContain(paso)
    }
  })

  it('y con el, el grep que hace el paso A util', () => {
    expect(resumen).toContain("grep -rniE 'balance|credit|debit")
  })

  it('lo encabeza FORTRESS con su vocabulario, no la prosa de la plantilla', () => {
    expect(resumen.split('\n')[0]).toBe('M8 Integridad de negocio — en src/api:')
  })
})
