import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import type { CodeAgentRequest } from '@domain/chat/code-agent'
import { argsDelTurno } from './args-del-turno'

/**
 * ADR-078 (enmienda 2026-10-05): un turno SIN agente heredaba el modelo del CLI
 * —Fable una noche, Opus a otra hora—. Ahora declara el suyo, o no se lanza: un
 * turno sin agente y sin modelo es exactamente lo que no debe poder existir.
 */
const turno = (over: Partial<CodeAgentRequest>): CodeAgentRequest => ({ projectPath: '/tmp', prompt: 'p', permissionMode: 'lectura', agentId: null, trusted: false, ...over }) // prettier-ignore
const lanzar = (r: CodeAgentRequest): ReturnType<typeof argsDelTurno> => argsDelTurno(r, {}, null, 1, null)
const modeloDe = (args: readonly string[]): string | null => (args.includes('--model') ? args[args.indexOf('--model') + 1] : null) // prettier-ignore

describe('el turno sin agente declara su modelo, o no se lanza', () => {
  it('sin agente y con modelo → lleva --model con ese alias', () => {
    const r = lanzar(turno({ model: 'sonnet' }))
    expect(r.ok && modeloDe(r.value.args)).toBe('sonnet')
  })

  it('sin agente y SIN modelo → no se lanza (heredar es loteria)', () => {
    expect(lanzar(turno({}))).toMatchObject({ ok: false, error: expect.stringMatching(/sin-modelo-declarado/) }) // prettier-ignore
  })

  it('con agente → sin --model: manda el modelo declarado del agente (ADR-078)', () => {
    const r = lanzar(turno({ agentId: 'security-reviewer' }))
    expect(r.ok && modeloDe(r.value.args)).toBeNull()
  })
})

/** Las CINCO rutas del censo que lanzaban sin agente, cada una con SU rol.
 *  (`run-build.ts` no lanza: delega en `buildFeature`; su `agentId: null` es
 *  un mensaje del historial — el censo lo conto mal y el typecheck lo cazo.) */
const RUTAS: ReadonlyArray<readonly [string, string]> = [
  ['src/application/build/build-feature.ts', 'construir'],
  ['src/infrastructure/build/run-investigate.ts', 'construir'],
  ['src/application/chat/reply-from-configuration.ts', 'configuracion'],
  ['src/application/system/draft-agent-auto.ts', 'borrador'],
  ['src/application/system/run-learning-episode.ts', 'episodio']
]

describe('cada ruta sin agente pide el modelo de SU rol', () => {
  it.each(RUTAS)('%s → MODELO_POR_ROL.%s', (fichero, rol) => {
    expect(readFileSync(fichero, 'utf8')).toContain(`model: MODELO_POR_ROL.${rol}`)
  })
})

describe('el grafo (indexar y verificar) declara su modelo', () => {
  it('indexar y verificar llevan --model sonnet: SI lanzan un claude (no el binario Go)', async () => {
    const { argsDeIndexar } = await import('../graph/index-graph')
    const { verifyArgs } = await import('../graph/verify-graph')
    expect(modeloDe(argsDeIndexar().args)).toBe('sonnet')
    expect(modeloDe(verifyArgs().args)).toBe('sonnet')
  })
})
