import { afterAll, describe, expect, it } from 'vitest'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { argsDelGenerador, MAX_TURNS } from './generator-args'

afterAll(limpiarCarpetasDePrueba)

describe('el techo de turnos', () => {
  it('esta calibrado con los datos: sobre las que completaban, bajo las que divagaban', () => {
    // Completaron en 4-25 vueltas; reventaron el tope con 32, 35, 44 y 50.
    expect(MAX_TURNS).toBeGreaterThan(25)
    expect(MAX_TURNS).toBeLessThan(32)
  })

  /** Los args del generador para un worktree de prueba: con la caja del CLI
   *  puesta (ADR-092), asi que fallan cerrado si no hay bwrap en la maquina. */
  const args = (): readonly string[] => {
    const r = argsDelGenerador(
      'arregla esto',
      carpetaDePrueba('.fortress-gen-test-'),
      '/grafo/turno'
    )
    if (!r.ok) throw new Error(r.error)
    return r.value
  }

  it('el generador se lanza CON el techo puesto', () => {
    const a = args()
    expect(a).toContain('--max-turns')
    expect(a[a.indexOf('--max-turns') + 1]).toBe(String(MAX_TURNS))
  })

  it('sigue lanzandose sin Bash: el commit y el gate son del motor', () => {
    const a = args()
    const tools = a[a.indexOf('--allowedTools') + 1] ?? ''
    expect(tools).toContain('Edit')
    expect(tools.split(',')).not.toContain('Bash')
  })

  it('y con la caja del CLI: --settings va en los args', () => {
    expect(args()).toContain('--settings')
  })
})
