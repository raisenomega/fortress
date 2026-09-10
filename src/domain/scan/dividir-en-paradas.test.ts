import { describe, expect, it } from 'vitest'
import { dividirEnParadas, RAIZ } from './dividir-en-paradas'
import { CONTENEDOR_UNICO, MONOREPO, RAIZ_PLANA } from './formas-de-proyecto'

const carpetas = (ficheros: readonly string[]): readonly string[] =>
  dividirEnParadas(ficheros).paradas.map((p) => p.carpeta)

describe('la division reparte por carpeta', () => {
  it('contenedor unico: agrupa por DOS segmentos', () => {
    expect(carpetas(CONTENEDOR_UNICO)).toEqual([
      'src/application',
      'src/domain',
      'src/infrastructure'
    ])
  })

  it('monorepo: agrupa por DOS segmentos, una parada por app', () => {
    expect(carpetas(MONOREPO)).toEqual(['apps/api', 'apps/web', 'apps/worker'])
  })

  it('raiz plana: agrupa por UN segmento', () => {
    expect(carpetas(RAIZ_PLANA)).toEqual(['handlers', 'models', 'utils'])
  })

  it('cada fichero cae en su parada, y en una sola', () => {
    const { paradas } = dividirEnParadas(MONOREPO)

    expect(paradas.find((p) => p.carpeta === 'apps/api')?.ficheros).toEqual([
      'apps/api/src/main.ts',
      'apps/api/src/modules/identity/Tenant.controller.ts'
    ])
    expect(paradas.find((p) => p.carpeta === 'apps/worker')?.ficheros).toEqual(['apps/worker/index.ts']) // prettier-ignore
  })
})

describe('ficherosTotal es la Y de «audite X de Y»', () => {
  // Envueltos en otro array: `it.each` despliega el caso como argumentos, y sin
  // la envoltura cada fichero llegaria suelto en vez de la lista entera.
  it.each([[CONTENEDOR_UNICO], [MONOREPO], [RAIZ_PLANA]])('suma exacta', (ficheros) => {
    const { paradas, ficherosTotal } = dividirEnParadas(ficheros)

    expect(ficherosTotal).toBe(ficheros.length)
    expect(paradas.reduce((n, p) => n + p.ficheros.length, 0)).toBe(ficherosTotal)
  })
})

describe('bordes', () => {
  it('una sola carpeta: UNA sola parada (el escaneo monolitico de hoy)', () => {
    expect(carpetas(['src/a.ts', 'src/b.ts', 'src/c.ts'])).toEqual(['src'])
  })

  it('un fichero de la raiz no inventa una parada con su nombre', () => {
    expect(carpetas(['index.ts', 'util.ts'])).toEqual([RAIZ])
  })

  it('sin ficheros no hay paradas que prometer', () => {
    expect(dividirEnParadas([])).toEqual({ paradas: [], ficherosTotal: 0 })
  })
})
