import { describe, expect, it } from 'vitest'
import { bloqueDeCapacidades, capacidadesDe } from '@domain/agent/capacidades-del-agente'
import { buildAnalysisPrompt } from '@domain/repair/analysis-prompt'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import { buildArgs } from '../claude-code/claude-cli'
import { argsDeLectura, argsDelGenerador, type Prompt } from './generator-args'

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'x' }
const abre = <T>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}
/**
 * EL TEST DERIVADO: el prompt dice de Bash lo que dicen los args con los que se
 * lanza, en los dos sentidos. Un texto fijo no puede pasar por aqui: el motor no
 * niega Bash (lo tiene, medido en vivo), el modo `lectura` si lo niega.
 * ADR-112: el prompt ya no VIAJA en los args — se lee de `.prompt`—, pero sigue
 * REFLEJANDO los flags: el contrato que este test clava no cambio de sustancia.
 */
describe('el prompt refleja las capacidades reales del lanzamiento', () => {
  it('el analista se lanza con las flags que le dan Bash, y su prompt lo dice', () => {
    const l = abre(argsDeLectura((c) => buildAnalysisPrompt(TARGET, EMPTY_CORPUS, [], 'g', c), '/p', '/grafo/turno', 'analista')) // prettier-ignore
    expect(capacidadesDe(l.args).bash).toBe(true)
    expect(l.prompt).toContain('Tienes Bash')
    expect(l.prompt).not.toContain('NO tienes Bash')
  })

  it('las capacidades que recibe el constructor son las de los args que se lanzan', () => {
    for (const lanzar of [(p: Prompt, d: string, g: string) => argsDeLectura(p, d, g, 'analista'), argsDelGenerador]) {
      const l = abre(lanzar((c) => JSON.stringify(c), '/p', '/grafo/turno'))
      expect(JSON.parse(l.prompt)).toEqual(capacidadesDe(l.args))
    }
  })

  it('el modo lectura del Terminal niega Bash de verdad, y el bloque lo refleja', () => {
    const l = buildArgs('x', 'lectura', {}, null, 0)
    expect(capacidadesDe(l.args).bash).toBe(false)
    expect(bloqueDeCapacidades(capacidadesDe(l.args)).join(' ')).toContain('NO tienes Bash')
  })

  it('auditoria (el escaner) tiene Bash, y el bloque lo refleja', () => {
    const l = buildArgs('x', 'auditoria', {}, null, 0)
    expect(capacidadesDe(l.args).bash).toBe(true)
    expect(bloqueDeCapacidades(capacidadesDe(l.args)).join(' ')).toContain('Tienes Bash')
  })
})
