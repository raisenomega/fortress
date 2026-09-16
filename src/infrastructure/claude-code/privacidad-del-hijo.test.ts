import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { buildEnv } from './build-env'

const PRIVADAS = ['CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC', 'DISABLE_FEEDBACK_COMMAND']

afterEach(() => {
  for (const clave of PRIVADAS) delete process.env[clave]
})

describe('privacidad del hijo: el codigo del cliente no sale por caminos sueltos', () => {
  it('apaga el trafico no esencial y el comando de feedback', () => {
    const env = buildEnv(null)

    expect(env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC).toBe('1')
    expect(env.DISABLE_FEEDBACK_COMMAND).toBe('1')
  })

  it('manda FORTRESS, no lo que traiga el entorno del operador', () => {
    for (const clave of PRIVADAS) process.env[clave] = '0'
    const env = buildEnv('sk-ant-xyz')

    for (const clave of PRIVADAS) expect(env[clave]).toBe('1')
  })

  it('las llevan TODOS los spawns del CLI, porque todos pasan por buildEnv', () => {
    const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
    const spawns = [
      'src/infrastructure/claude-code/claude-code-agent.ts',
      'src/infrastructure/repair/graph-omega.ts',
      'src/infrastructure/repair/graph-generator.ts',
      'src/infrastructure/repair/graph-analyst.ts'
    ]

    for (const ruta of spawns) expect(fuente(ruta)).toMatch(/env: buildEnv\(|= buildEnv\(/)
  })
})
