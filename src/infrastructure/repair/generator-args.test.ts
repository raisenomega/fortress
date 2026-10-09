import { afterAll, describe, expect, it } from 'vitest'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { argsDelGenerador } from './generator-args'
import { NPM_SOLO_LOCK } from './motor-tools'
import { MAX_TURNS } from './techo-de-turnos'

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
      '/grafo/turno',
      true
    )
    if (!r.ok) throw new Error(r.error)
    return r.value.args
  }

  it('el generador se lanza CON el techo puesto', () => {
    const a = args()
    expect(a).toContain('--max-turns')
    expect(a[a.indexOf('--max-turns') + 1]).toBe(String(MAX_TURNS))
  })

  it('sin Bash ABIERTO: la unica entrada Bash es la forma segura del lock (ADR-111)', () => {
    const a = args()
    const tools = a[a.indexOf('--allowedTools') + 1] ?? ''
    expect(tools).toContain('Edit')
    expect(tools.split(',')).not.toContain('Bash')
    expect(tools.split(',').filter((t) => t.startsWith('Bash'))).toEqual([NPM_SOLO_LOCK])
  })

  it('y con la caja del CLI: --settings va en los args', () => {
    expect(args()).toContain('--settings')
  })
})

describe('argsDelGenerador: la vuelta del lazo reanuda la sesion (ADR-110)', () => {
  const conSesion = (sesion?: string): readonly string[] => {
    const r = argsDelGenerador('p', '/wt', null, true, sesion)
    return r.ok ? r.value.args : []
  }

  it('sin sesion no se reanuda nada: la primera vuelta corre limpia', () => {
    expect(conSesion()).not.toContain('--resume')
    expect(conSesion()).not.toContain('--fork-session')
  })

  it('con sesion van --resume <id> y --fork-session, juntos', () => {
    const a = conSesion('ses-7')
    expect(a[a.indexOf('--resume') + 1]).toBe('ses-7')
    // --fork-session deja intacta la original y abre una nueva desde ese punto:
    // por eso el id cambia cada vuelta y el lazo lo recaptura (medido).
    expect(a).toContain('--fork-session')
  })

  it('y la caja y el techo siguen puestos en la vuelta reanudada', () => {
    const a = conSesion('ses-7')
    expect(a).toContain('--settings')
    expect(a).toContain('--max-turns')
    expect(a[a.indexOf('--permission-mode') + 1]).toBe('acceptEdits')
  })
})
