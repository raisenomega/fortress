import { describe, expect, it } from 'vitest'
import { enCarpeta } from './plantilla-fixture'
import { sintetica } from './plantilla-sintetica'
import { cuerpoAccionable } from './plantilla-accionable'
import { resumenDeModulo } from './resumen-de-modulo'

// Contra la SINTETICA y no contra el kit: esto prueba el CODIGO, y el kit no
// viaja al worktree donde corre el gate del Motor (ADR-108 §5). Que las doce
// plantillas de verdad encajen lo prueba `plantilla-contrato`.
const M8 = sintetica('M8')
const cuerpo = cuerpoAccionable(M8.texto) ?? ''
const resumen = resumenDeModulo(M8, enCarpeta('src/api'), 'Proyecto') ?? ''

/** Lo que NO puede viajar, y por que cada cosa. */
const PODADO: ReadonlyArray<readonly [string, string]> = [
  ['**Entregable:**', 'pide ESCRIBIR un fichero'],
  ['{{OUTPUT_DIR}}', 'apunta a una carpeta de salida que no existe'],
  ['S0', 'trae su propio contrato de severidad'],
  ['Firma', 'cierra un informe que aqui no se escribe'],
  ['═══', 'delimitador del kit, no del prompt'],
  ['Carga informes previos', 'apunta a un flujo que aqui no existe']
]

describe('la poda deja el cuerpo accionable y nada mas', () => {
  it.each(PODADO)('no viaja %s: %s', (trozo) => {
    expect(resumen).not.toContain(trozo)
  })

  it('el cuerpo de pasos SI viaja entero, del primero al ultimo', () => {
    for (const paso of ['**A.', '**B.', '**C.']) expect(cuerpo).toContain(paso)
  })

  it('y con el, el comando que hace el primer paso util', () => {
    expect(resumen).toContain("grep -rniE 'uno|dos'")
  })

  it('lo encabeza FORTRESS con su vocabulario, no la prosa de la plantilla', () => {
    expect(resumen.split('\n')[0]).toBe('M8 Integridad de negocio — en src/api:')
  })
})
