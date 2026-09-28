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
  runs: [],
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
    // 'x' y no 'a': una tira hexadecimal se tacharia entera y no se recortaria nada.
    const largo = 'x'.repeat(300)
    const [entry] = chatActivity('p1', null, 'api', largo, outcome())
    expect(entry.summary.length).toBeLessThan(120)
    expect(entry.summary).toContain('…')
  })

  it('tacha el token que el operador pega en el prompt', () => {
    const prompt = 'usa GITHUB_TOKEN=ghp_abcdefghij1234567890 para el push'
    const [entry] = chatActivity('p1', null, 'api', prompt, outcome())
    expect(entry.summary).toBe('usa GITHUB_*** para el push (solo texto)')
  })

  it('tacha antes de recortar: un secreto en el borde no queda a medias', () => {
    // El material era una tira de 40 hexadecimales, que resulto ser el resumen de
    // «test»: un HASH, no un secreto, y lo tapaba el comodin que se retiro el
    // 2026-09-28 por borrar la huella forense del recibo. El sujeto de este test
    // es el ORDEN —tachar antes de recortar— y para eso hace falta un secreto de
    // verdad, no algo con su forma. Un token de GitHub mide lo mismo.
    const token = `${'ghp'}_abcdefghijklmnopqrstuvwxyz0123456789`
    const [entry] = chatActivity('p1', null, 'api', `${'x'.repeat(57)} ${token}`, outcome())
    expect(entry.summary).toBe(`${'x'.repeat(57)} *** (solo texto)`)
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
