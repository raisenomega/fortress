import { describe, expect, it } from 'vitest'
import type { ScopeGroup } from '@domain/repair/scope-groups'
import { bench } from './generate-fix-fixture'
import { generateFix } from './generate-fix'

/** El caso del ensayo: un archivo sin extension, que la correa universal no
 *  puede alcanzar porque exige un punto en el nombre. */
const SIN_EXTENSION = 'public/_headers'

const PUBLIC: ScopeGroup = { name: 'headers', when: 'public/**', allow: ['public/**'] }

const razon = async (opts: Parameters<typeof bench>[0]): Promise<string | undefined> => {
  const b = bench(opts)
  const result = await generateFix(b.context, 'prop-1', b.deps)
  return result.ok ? undefined : result.reason
}

describe('un archivo sin correa posible todavia puede tener grupo', () => {
  it('con grupo aplicable, el fix ya no muere antes de generarse', async () => {
    // Antes cortaba aqui: la correa salia vacia y nadie miraba los grupos.
    const motivo = await razon({ ancla: SIN_EXTENSION, scopeGroups: [PUBLIC], changed: ['public/_headers'] }) // prettier-ignore

    expect(motivo).not.toBe('scope_violation')
  })

  it('sin grupo aplicable sigue cortando: no hay terreno que darle', async () => {
    expect(await razon({ ancla: SIN_EXTENSION })).toBe('scope_violation')
  })

  it('un grupo que NO casa el ancla no salva nada', async () => {
    const otro: ScopeGroup = { name: 'otro', when: 'docs/**', allow: ['docs/**'] }

    expect(await razon({ ancla: SIN_EXTENSION, scopeGroups: [otro] })).toBe('scope_violation')
  })

  it('sin ancla no hay nada que casar, con grupos o sin ellos', async () => {
    expect(await razon({ sinPrimary: true, scopeGroups: [PUBLIC] })).toBe('scope_violation')
  })
})
