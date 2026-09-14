import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { verificable } from './verificable'

const f = (lifecycle: string, status: string): Parameters<typeof verificable>[0] =>
  ({ lifecycle, status }) as Parameters<typeof verificable>[0]

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

describe('a quien se le puede pedir una comprobacion', () => {
  it('un mitigado abierto SI: hay un fix y el hallazgo todavia cuenta', () => {
    expect(verificable(f('MITIGATED', 'open'))).toBe(true)
  })

  it('un mitigado DESCARTADO no: su dueño ya dijo que no contaba', () => {
    // Mirando solo el ciclo de vida entraba en el barrido, y el motor le gastaba
    // una corrida de agente a algo que el operador habia apartado.
    expect(verificable(f('MITIGATED', 'false_positive'))).toBe(false)
  })

  it('un activo no, por abierto que este: no hay fix que comprobar', () => {
    expect(verificable(f('ACTIVE', 'open'))).toBe(false)
  })

  it('y un extinto tampoco: ya murio con juicio', () => {
    expect(verificable(f('EXTINCT', 'open'))).toBe(false)
  })
})

/**
 * El criterio se escribio tres veces y por eso divergio. Este barrido fija que
 * los TRES preguntan a la misma funcion: la cajita de la fila, el contador del
 * boton y la puerta del motor —que es por donde entra el bucle—.
 */
describe('los tres consumidores usan el MISMO criterio', () => {
  it.each([
    ['la cajita de la fila', 'src/presentation/components/scan/FindingRow.tsx'],
    ['el contador del boton', 'src/presentation/components/scan/ScanActions.tsx'],
    ['la puerta del motor', 'src/application/repair/elegir-para-verificar.ts']
  ])('%s llama a verificable()', (_quien, ruta) => {
    expect(fuente(ruta)).toContain('verificable')
  })

  it.each([
    ['la cajita de la fila', 'src/presentation/components/scan/FindingRow.tsx'],
    ['el contador del boton', 'src/presentation/components/scan/ScanActions.tsx'],
    ['la puerta del motor', 'src/application/repair/elegir-para-verificar.ts']
  ])('%s NO decide el criterio por su cuenta', (_quien, ruta) => {
    // Un `lifecycle === 'MITIGATED'` suelto para DECIDIR es la divergencia
    // volviendo: el de `FindingRow` que queda es para atenuar la fila, no para
    // ofrecer la cajita, y por eso se comprueba junto a `verificable(`.
    const texto = fuente(ruta)
    const sueltos = [...texto.matchAll(/lifecycle === 'MITIGATED'/g)]

    expect(sueltos.length).toBeLessThanOrEqual(1)
  })
})
