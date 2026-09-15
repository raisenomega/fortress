import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * El cableado de «Resolver en Terminal» en la fila (ADR-088, pieza 2). Se lee
 * el FUENTE, como `tabla-vacia`: los tests de este repo no pintan componentes,
 * y lo que hay que fijar es QUE condicion y QUE llamada lleva el boton.
 */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const ACCIONES = fuente('src/presentation/components/scan/FindingRowActions.tsx')

describe('el boton «Resolver en Terminal» en cada fila del Escaneo', () => {
  it('aparece con el MISMO criterio que el Bot: los dos hechos de la fila', () => {
    expect(ACCIONES).toMatch(
      /seResuelveEnTerminal\(\{ dismissed, mitigado \}\) \? \(\s*<FindingResolverAction onResolver=\{\(\) => props\.onResolver\(finding\.id\)\} \/>/
    )
  })

  it('el Bot sigue intacto: su condicion y su llamada, tal cual', () => {
    expect(ACCIONES).toMatch(
      /\{!dismissed && !mitigado \? \(\s*<FindingRepairAction onRepair=\{\(\) => props\.onRepair\(finding\.id\)\} \/>/
    )
  })

  it('no mira la severidad: el Terminal resuelve cualquiera, CRITICAL y HIGH incluidos', () => {
    const boton = fuente('src/presentation/components/scan/FindingResolverAction.tsx')
    const criterio = fuente('src/domain/project/se-resuelve-en-terminal.ts')

    for (const texto of [boton, criterio.replace(/\/\*\*[\s\S]*?\*\//g, '')]) {
      expect(texto).not.toMatch(/severity|CRITICAL|HIGH/)
    }
  })

  it('la tabla lo conecta a resolverEnTerminal, con el hallazgo de esa fila', () => {
    const tabla = fuente('src/presentation/components/scan/props-de-la-tabla.ts')

    expect(tabla).toMatch(
      /onResolver: \(id\) => \{[\s\S]{0,120}resolverEnTerminal\(project\.id, fila\)/
    )
  })
})
