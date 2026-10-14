import { describe, expect, it } from 'vitest'
import { chocaEnLaCorrida, ordenDeFirma } from './orden-de-firma'

/**
 * Deuda #2, pieza 1: la guia ESTATICA del orden de firma, con las funciones que
 * ya existian (tocaDependencias, ficherosEnComun). Cubre (a) package.json al
 * final —en cuanto entra, las cruzadas caducan sin medir— y (b) grupos por
 * fichero comun. (c), la interaccion sin fichero comun, es de la sonda.
 */
const p = (id: string, ...files: string[]): { id: string; files: string[] } => ({ id, files })

describe('ordenDeFirma (la guia estatica)', () => {
  it('las que tocan package.json o el lock van AL FINAL, aunque entren primero', () => {
    const guia = ordenDeFirma([p('dep', 'package.json'), p('a', 'src/a.ts'), p('lock', 'package-lock.json')]) // prettier-ignore
    expect(guia.orden).toEqual(['a', 'dep', 'lock'])
    expect(guia.dependencias).toEqual(['dep', 'lock'])
  })

  it('las que comparten fichero quedan agrupadas y ADYACENTES en el orden', () => {
    const guia = ordenDeFirma([
      p('a', 'src/x.ts'),
      p('b', 'src/y.ts', 'src/z.ts'),
      p('c', 'src/x.ts', 'src/w.ts')
    ])
    expect(guia.grupos).toEqual([['a', 'c']])
    expect(guia.orden).toEqual(['a', 'c', 'b'])
  })

  it('el grupo es transitivo: a-b y b-c forman UN grupo', () => {
    const guia = ordenDeFirma([p('a', 'x.ts'), p('b', 'x.ts', 'y.ts'), p('c', 'y.ts')])
    expect(guia.grupos).toEqual([['a', 'b', 'c']])
  })

  it('el PUENTE fusiona grupos ya formados: c toca a la vez lo de a y lo de b', () => {
    // El mutante que solo miraba el primer grupo tocado paso el test de arriba
    // y cayo aqui: a y b nacen separados y c los une DESPUES.
    const guia = ordenDeFirma([p('a', 'x.ts'), p('b', 'y.ts'), p('c', 'x.ts', 'y.ts')])
    expect(guia.grupos).toEqual([['a', 'b', 'c']])
  })

  it('sin ficheros comunes ni dependencias: el orden de entrada, cero avisos', () => {
    const guia = ordenDeFirma([p('a', 'x.ts'), p('b', 'y.ts')])
    expect(guia).toEqual({ orden: ['a', 'b'], grupos: [], dependencias: [] })
  })
})

describe('chocaEnLaCorrida (la senal del drenaje)', () => {
  it('dos de la MISMA corrida sobre el mismo fichero chocan', () => {
    expect(chocaEnLaCorrida(['src/x.ts', 'src/y.ts'], ['src/y.ts', 'src/z.ts'])).toEqual(['src/y.ts'])
  })

  it('sin fichero comun no choca', () => {
    expect(chocaEnLaCorrida(['src/x.ts'], ['src/y.ts'])).toEqual([])
  })

  it('mismo fichero cuenta como choque aunque el cambio sea en otra linea (conservador)', () => {
    // A nivel de lista no hay lineas: pisar el mismo fichero basta, por diseno.
    // El lado seguro — una senal de mas cuesta una linea en el parte; una de
    // menos es el GAP. (c), el choque sin fichero comun, es de `medirLaTanda`.
    expect(chocaEnLaCorrida(['src/a.ts'], ['src/a.ts'])).toEqual(['src/a.ts'])
  })
})
