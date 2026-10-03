import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { escenario, npmQueFalla } from './arbol-integrado-fixture'
import { medirArbolIntegrado } from './medir-arbol-integrado'
import { git } from './merge-repo-fixture'

/**
 * Deuda #2, pieza 3: tras una medida ROJA el merge de la sonda se quedaba en el
 * worktree (solo habia abort en el choque textual), asi que la siguiente medida
 * —la biseccion de la tanda, o cualquier «medir y seguir viva»— media un arbol
 * contaminado. El reset va SOLO tras el rojo: en verde la sonda se queda A
 * PROPOSITO, porque es lo que entra (en la historia real, el merge de la firma
 * `13840d4` lleva la medida `3f98426` como segundo padre: lo medido ES lo que
 * se integro).
 */
describe('la medida roja deja el worktree como estaba', () => {
  it('tras un gate rojo, HEAD vuelve al tip del fix y el avance del destino se va', async () => {
    const e = escenario('a.ts', 'b.ts')
    const tip = git(e.worktree, 'rev-parse', 'HEAD').trim()

    const medida = await medirArbolIntegrado('duenyo', e.worktree, e.repo, npmQueFalla('lint'))

    expect(medida.ok).toBe(false)
    expect(git(e.worktree, 'rev-parse', 'HEAD').trim()).toBe(tip)
    // El avance del destino se fue: b.ts vuelve a ser el de la base del fix.
    expect(readFileSync(join(e.worktree, 'b.ts'), 'utf8')).toBe('base\n')
  })

  it('el VERDE conserva la sonda a proposito: lo medido es lo que entra', async () => {
    const e = escenario('a.ts', 'b.ts')
    const tip = git(e.worktree, 'rev-parse', 'HEAD').trim()

    const medida = await medirArbolIntegrado('duenyo', e.worktree, e.repo, npmQueFalla('ninguno'))

    expect(medida.ok).toBe(true)
    expect(git(e.worktree, 'rev-parse', 'HEAD').trim()).not.toBe(tip)
    expect(readFileSync(join(e.worktree, 'b.ts'), 'utf8')).toBe('destino\n')
  })
})
