import { describe, expect, it } from 'vitest'
import { acota, envDe, llamadas, sinAcotar } from './spawn-acotado-fixture'
import { LISTA_BLANCA, RECORTE } from './formas-acotadas-fixture'
import { CRUDO, MIXTO, OPACO } from './formas-que-no-acotan-fixture'

/**
 * El guardian de los spawns juzga el entorno por su FORMA, no por el nombre de
 * quien lo construye.
 *
 * Nace de una rotura real: el 2026-10-02 dos fixes buenos entraron a main por
 * separado —el guardian aprendio a rastrear el `env`, y `entornoDelMerge` paso a
 * ser una lista blanca— y juntos dejaron main en ROJO marcando el codigo MAS
 * seguro de los dos. Una propuesta inocente caduco por ello (DEUDAS §16).
 */

describe('el guardian juzga la FORMA del constructor, no su nombre', () => {
  it('una lista blanca desde {} con claves nombradas pasa, sin estar en ninguna lista', () => {
    expect(sinAcotar(LISTA_BLANCA)).toEqual([])
  })

  it('y el recorte historico sigue bendecido por nombre: buildEnv no pierde su sitio', () => {
    expect(sinAcotar(RECORTE)).toEqual([])
  })

  it('pero el entorno entero sigue cazado: la proteccion no se aflojo', () => {
    expect(sinAcotar(CRUDO)).toHaveLength(1)
  })

  it('el MIXTO no cuela: copiar claves nombradas Y esparcir el entorno no es acotar', () => {
    // Tiene las dos marcas; la de heredar manda, porque heredar es la fuga.
    expect(sinAcotar(MIXTO)).toHaveLength(1)
  })

  it('y no heredar NO basta: un constructor OPACO tampoco pasa', () => {
    // La regla exige VER la lista blanca, no solo la ausencia de la fuga.
    expect(sinAcotar(OPACO)).toHaveLength(1)
  })

  it('un spawn con cwd y SIN clave env hereda todo, y se caza', () => {
    const sinEnv = "import { execFile } from 'child_process'\nexecFile('git', [], { cwd }, () => 1)"
    expect(sinAcotar(sinEnv)).toHaveLength(1)
  })

  it('las piezas por separado: el env de la llamada y el salto por la declaracion', () => {
    expect(envDe('{ cwd, env, timeout: 1000 }')).toBe('env')
    expect(llamadas(LISTA_BLANCA).some((o) => /\bcwd\b/.test(o))).toBe(true)
    expect(acota(LISTA_BLANCA, 'entornoDelMerge()')).toBe(true)
    expect(acota(CRUDO, 'entornoSucio()')).toBe(false)
  })
})
