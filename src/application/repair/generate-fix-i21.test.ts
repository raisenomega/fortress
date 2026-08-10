import { describe, expect, it } from 'vitest'
import { bench } from './generate-fix-fixture'
import { generateFix } from './generate-fix'

describe('generateFix — I2.1 correa anclada al file estructurado', () => {
  it('el prompt lleva los 3 candidatos anclados al file del hallazgo', async () => {
    const b = bench()
    await generateFix(b.context, 'prop-1', b.deps)
    expect(b.prompts[0]).toContain('- src/a/b.ts')
    expect(b.prompts[0]).toContain('- src/a/b.test.ts')
    expect(b.prompts[0]).toContain('- src/a/b.spec.ts')
  })

  it('sin ancla estructurada RECHAZA sin caer a la prosa ni spawnear', async () => {
    const b = bench({ sinPrimary: true })
    const result = await generateFix(b.context, 'prop-1', b.deps)
    expect(result).toMatchObject({ ok: false, reason: 'scope_violation' })
    expect(result.ok === false && result.detail).toContain('no_primary_file')
    expect(b.calls).not.toContain('generate')
  })
})
