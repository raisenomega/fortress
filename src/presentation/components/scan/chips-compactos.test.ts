import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const fuente = (fichero: string): string =>
  readFileSync(join(process.cwd(), 'src/presentation/components/scan', fichero), 'utf8')

/**
 * Los dos ejes son UN control, no dos secciones. Apilados como bloques se comian
 * una linea entera cada uno aunque sobrara ancho, y se leian como dos cosas
 * sueltas. Esto fija la forma; los numeros y el cruce son de otros tests.
 */
describe('los dos ejes van en un solo flujo', () => {
  it('el contenedor fluye y se pliega, no apila bloques', () => {
    const texto = fuente('ChipsDelTablero.tsx')

    expect(texto).toContain('flex flex-wrap items-center')
    // `space-y-*` es lo que los apilaba: cada hijo, su propia linea.
    expect(texto).not.toMatch(/className="space-y-/)
  })

  it('y se pliega MAS APRETADO de lo que se separa: sin hueco entre filas', () => {
    // Al plegarse, el hueco vertical tiene que ser menor que el horizontal, o
    // volveriamos a ver dos secciones con aire en medio.
    const texto = fuente('ChipsDelTablero.tsx')
    const x = texto.match(/gap-x-(\d+)/)?.[1]
    const y = texto.match(/gap-y-(\d+)/)?.[1]

    expect(Number(y)).toBeLessThan(Number(x))
  })

  it('con una raya que impide leerlos como nueve chips seguidos', () => {
    const texto = fuente('ChipsDelTablero.tsx')

    expect(texto).toMatch(/<span aria-hidden className="bg-border/)
  })
})

/**
 * La raya es decorativa, asi que compartir linea no puede costar la separacion
 * entre ejes para quien no la ve: cada uno se anuncia como su propio grupo.
 */
describe('cada eje sigue siendo distinguible sin verlo', () => {
  it.each([
    ['FilaDeSeveridad.tsx', 'Filtrar por severidad'],
    ['FilaDeEstado.tsx', 'Filtrar por estado']
  ])('%s se anuncia como grupo con nombre', (fichero, etiqueta) => {
    const texto = fuente(fichero)

    expect(texto).toContain('role="group"')
    expect(texto).toContain(`aria-label="${etiqueta}"`)
  })
})

describe('el layout no toco la logica', () => {
  it('los chips siguen llamando a onElegir con su valor, y ALL sigue siendo ALL', () => {
    for (const fichero of ['FilaDeSeveridad.tsx', 'FilaDeEstado.tsx']) {
      expect(fuente(fichero)).toContain('onClick={() => onElegir(TODAS)}')
      expect(fuente(fichero)).toMatch(/activo=\{activo === (severity|estado)\}/)
      expect(fuente(fichero)).toMatch(/cuenta=\{cuentas\[(severity|estado)\]\}/)
    }
  })
})
