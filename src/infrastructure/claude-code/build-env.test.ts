import { describe, expect, it } from 'vitest'
import { buildEnv } from './claude-cli'

describe('buildEnv', () => {
  it('pasa la key configurada en FORTRESS', () => {
    expect(buildEnv('sk-ant-xyz').ANTHROPIC_API_KEY).toBe('sk-ant-xyz')
  })

  it('sin key, deja que claude use sus propias credenciales', () => {
    expect(buildEnv(null)).toBe(process.env)
  })
})
