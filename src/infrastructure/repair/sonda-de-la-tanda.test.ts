import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { git } from './merge-repo-fixture'
import { sondaDeLaTanda } from './sonda-de-la-tanda'
import { escenarioDeTanda, npmQueRompeConElPar } from './tanda-fixture'

/**
 * Deuda #2, pieza 2 (infra): la sonda del CONJUNTO sobre el caso real del
 * 2-oct — juez y juzgado, sin fichero comun, verdes solos y rojos juntos.
 */
describe('sondaDeLaTanda', () => {
  it('cada una SOLA da verde; las dos JUNTAS dan rojo (el caso del 2-oct)', async () => {
    const e = escenarioDeTanda('juez.ts', 'juzgado.ts')
    const npm = npmQueRompeConElPar()

    const sola = await sondaDeLaTanda('duenyo', [e.miembros[0]!], e.repo, npm)
    expect(sola.ok).toBe(true)
    const juntas = await sondaDeLaTanda('duenyo', [...e.miembros], e.repo, npm)
    expect(juntas.ok).toBe(false)
    expect(juntas.comandos).toContain('test:unit')
  })

  it('la sonda NUNCA deja residuo: ni en verde ni en rojo, el anfitrion queda intacto', async () => {
    const e = escenarioDeTanda('juez.ts', 'juzgado.ts')
    const npm = npmQueRompeConElPar()
    const anfitrion = e.miembros[0]!
    const tip = git(anfitrion.worktreePath, 'rev-parse', 'HEAD').trim()

    await sondaDeLaTanda('duenyo', [...e.miembros], e.repo, npm) // rojo
    expect(git(anfitrion.worktreePath, 'rev-parse', 'HEAD').trim()).toBe(tip)
    expect(existsSync(join(anfitrion.worktreePath, 'juzgado.ts'))).toBe(false)

    await sondaDeLaTanda('duenyo', [anfitrion], e.repo, npm) // verde
    expect(git(anfitrion.worktreePath, 'rev-parse', 'HEAD').trim()).toBe(tip)
    expect(readFileSync(join(anfitrion.worktreePath, 'juez.ts'), 'utf8')).toBe('fix\n')
  })

  it('el arbol vivo del proyecto no se toca: la sonda es del worktree', async () => {
    const e = escenarioDeTanda('juez.ts', 'juzgado.ts')
    const antes = git(e.repo, 'rev-parse', 'HEAD').trim()
    await sondaDeLaTanda('duenyo', [...e.miembros], e.repo, npmQueRompeConElPar())
    expect(git(e.repo, 'rev-parse', 'HEAD').trim()).toBe(antes)
    expect(existsSync(join(e.repo, 'juez.ts'))).toBe(false)
  })
})
