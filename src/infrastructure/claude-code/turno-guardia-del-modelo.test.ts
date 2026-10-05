import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import type { CodeAgentRequest } from '@domain/chat/code-agent'
import type { ApiKeyStore } from '@domain/settings/api-key-store'
import { DEFAULT_BUDGET } from '@domain/settings/run-budget'
import { createClaudeCodeAgent } from './claude-code-agent'

/**
 * El guardian del modelo en los TURNOS (Terminal, escaner, Construir...): el
 * evento final del stream trae `modelUsage`, y lo que corrio se juzga contra lo
 * pedido — el modelo del agente declarado, o el `model` del turno sin agente.
 * Con un `claude` falso de verdad en el PATH: prueba el cableado, no una pieza.
 */
const PATH_ORIGINAL = process.env.PATH
afterEach(() => void (process.env.PATH = PATH_ORIGINAL))

function claudeQueCorrioEn(...modelos: string[]): void {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-turno-modelo-'))
  const uso = Object.fromEntries(modelos.map((m, i) => [m, { outputTokens: 100 - i }]))
  const fin = JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: 'hecho', usage: { input_tokens: 1, output_tokens: 1 }, modelUsage: uso }) // prettier-ignore
  writeFileSync(join(dir, 'claude'), `#!/bin/sh\ncat >/dev/null\ncat <<'JSON'\n${fin}\nJSON\n`)
  chmodSync(join(dir, 'claude'), 0o755)
  process.env.PATH = `${dir}:${PATH_ORIGINAL ?? ''}`
}

const LLAVES = { read: () => null, has: () => false } as unknown as ApiKeyStore
const turno = (over: Partial<CodeAgentRequest>): CodeAgentRequest => ({ projectPath: mkdtempSync(join(tmpdir(), 'fcc-proy-')), prompt: 'x', permissionMode: 'lectura', agentId: null, model: 'opus', trusted: false, ...over }) // prettier-ignore
const correr = (r: CodeAgentRequest): ReturnType<ReturnType<typeof createClaudeCodeAgent>['run']> => createClaudeCodeAgent(LLAVES, DEFAULT_BUDGET, false).run(r, () => undefined) // prettier-ignore

describe('el turno juzga el modelo que de verdad corrio', () => {
  it('Productor (opus) que corrio en sonnet → turno FALLIDO, y lo dice', async () => {
    claudeQueCorrioEn('claude-sonnet-5-5')
    const r = await correr(turno({ agentId: 'productor' }))
    expect(r.failed).toBe(true)
    expect(r.text).toMatch(/modelo no asignado/)
    expect(r.modelo).toBe('claude-sonnet-5-5')
  })

  it('turno sin agente con model opus que corrio en Fable → FALLIDO', async () => {
    claudeQueCorrioEn('claude-fable-5')
    expect((await correr(turno({}))).failed).toBe(true)
  })

  it('refactor-cleaner (haiku) que corrio en haiku → OK, con su modelo registrado', async () => {
    claudeQueCorrioEn('claude-haiku-4-5-20251001')
    const r = await correr(turno({ agentId: 'refactor-cleaner' }))
    expect(r.failed).toBe(false)
    expect(r.modelo).toBe('claude-haiku-4-5-20251001')
  })
})
