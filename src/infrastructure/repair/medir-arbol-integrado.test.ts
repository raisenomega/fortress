import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { escenario, npmQueFalla } from './arbol-integrado-fixture'
import { ficherosDelDestino, medirArbolIntegrado } from './medir-arbol-integrado'

const VERDE = npmQueFalla('ninguno')

describe('que ha tocado el destino desde la base', () => {
  it('lo dice fichero a fichero', async () => {
    const e = escenario('a.ts', 'b.ts')
    expect(await ficherosDelDestino(e.repo, e.baseSha)).toEqual(['b.ts'])
  })

  it('una base que git ya no encuentra devuelve null, no una lista vacia', async () => {
    // Vacio significaria "el destino no se movio" sobre algo que nadie miro.
    const e = escenario('a.ts', 'b.ts')
    expect(await ficherosDelDestino(e.repo, '0'.repeat(40))).toBeNull()
  })
})

describe('el gate del motor sobre el arbol integrado, dentro del worktree', () => {
  it('el destino se mergea en el worktree y los tres comandos corren ahi', async () => {
    const e = escenario('a.ts', 'b.ts')
    const medida = await medirArbolIntegrado('duenyo', e.worktree, e.repo, VERDE)

    expect(medida).toMatchObject({ ok: true, comandos: ['typecheck', 'lint', 'test:unit'] })
    // El arbol integrado esta AHI: el fix y el avance del destino, juntos.
    expect(readFileSync(join(e.worktree, 'a.ts'), 'utf8')).toBe('fix\n')
    expect(readFileSync(join(e.worktree, 'b.ts'), 'utf8')).toBe('destino\n')
  })

  it('para en el primero que rompe y nombra solo lo que corrio', async () => {
    const e = escenario('a.ts', 'b.ts')
    const medida = await medirArbolIntegrado('duenyo', e.worktree, e.repo, npmQueFalla('lint'))

    expect(medida.ok).toBe(false)
    expect(medida.comandos).toEqual(['typecheck', 'lint'])
  })

  it('un choque TEXTUAL no deja el worktree a medias', async () => {
    // Los dos lados sobre el mismo fichero: git si lo ve. El merge se aborta,
    // y el abort de un worktree es suyo — no del repositorio entero, que es lo
    // que hace seguro hacerlo aqui y no en el arbol vivo (la leccion de la E).
    const e = escenario('a.ts', 'a.ts')
    const medida = await medirArbolIntegrado('duenyo', e.worktree, e.repo, VERDE)

    expect(medida.ok).toBe(false)
    expect(medida.detalle).toContain('choque textual')
    expect(medida.comandos).toEqual([])
    // Sin el abort, a.ts se queda con los marcadores del conflicto dentro y el
    // worktree inservible para la autopsia. El abort de un worktree es SUYO, no
    // del repositorio entero: eso es lo que hace seguro hacerlo aqui.
    expect(readFileSync(join(e.worktree, 'a.ts'), 'utf8')).not.toContain('<<<<<<<')
  })

  it('el arbol vivo no se toca: sigue donde estaba', async () => {
    const e = escenario('a.ts', 'b.ts')
    const antes = await ficherosDelDestino(e.repo, e.baseSha)
    await medirArbolIntegrado('duenyo', e.worktree, e.repo, npmQueFalla('typecheck'))

    expect(await ficherosDelDestino(e.repo, e.baseSha)).toEqual(antes)
  })
})
