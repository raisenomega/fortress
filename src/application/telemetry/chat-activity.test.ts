import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { ReplyOutcome } from '../chat/reply-outcome'
import { chatActivity } from './chat-activity'

const outcome = (edits: string[] = []): ReplyOutcome => ({
  text: 'listo',
  failed: false,
  usage: EMPTY_USAGE,
  tools: [],
  edits,
  agents: [],
  findings: []
})

describe('chatActivity', () => {
  it('anota que motor respondio', () => {
    const conHerramientas = chatActivity('p1', null, 'claude-code', 'revisa esto', outcome())
    const soloTexto = chatActivity('p1', null, 'api', 'revisa esto', outcome())

    expect(conHerramientas[0].summary).toContain('Claude Code')
    expect(soloTexto[0].summary).toContain('solo texto')
  })

  it('recorta prompts largos: el timeline es un indice, no un archivo', () => {
    const largo = 'a'.repeat(300)
    const [entry] = chatActivity('p1', null, 'api', largo, outcome())
    expect(entry.summary.length).toBeLessThan(120)
  })

  it('colapsa saltos de linea del prompt', () => {
    const [entry] = chatActivity('p1', null, 'api', 'revisa\n\n  la  seguridad', outcome())
    expect(entry.summary).toBe('revisa la seguridad (solo texto)')
  })

  it('registra los archivos que el agente escribio', () => {
    const entries = chatActivity('p1', null, 'claude-code', 'arregla', outcome(['src/app.ts']))
    expect(entries).toHaveLength(2)
    expect(entries[1]).toMatchObject({ kind: 'edit', file: 'src/app.ts' })
  })
})
