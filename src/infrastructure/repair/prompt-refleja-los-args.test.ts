import { describe, expect, it } from 'vitest'
import { bloqueDeCapacidades, capacidadesDe } from '@domain/agent/capacidades-del-agente'
import { buildAnalysisPrompt } from '@domain/repair/analysis-prompt'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import { buildArgs } from '../claude-code/claude-cli'
import { argsDeLectura, argsDelGenerador } from './generator-args'

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'x' }
const abre = <T>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}
const textoDe = (args: readonly string[]): string => args[args.indexOf('-p') + 1] ?? ''

/**
 * EL TEST DERIVADO: el prompt dice de Bash lo que dicen los args con los que se
 * lanza, en los dos sentidos. Un texto fijo no puede pasar por aqui: el motor no
 * niega Bash (lo tiene, medido en vivo), el modo `lectura` si lo niega.
 */
describe('el prompt refleja las capacidades reales del lanzamiento', () => {
  it('el analista se lanza con las flags que le dan Bash, y su prompt lo dice', () => {
    const args = abre(argsDeLectura((c) => buildAnalysisPrompt(TARGET, EMPTY_CORPUS, [], 'g', c), '/p', '/grafo/turno')) // prettier-ignore
    const prompt = textoDe(args)
    expect(capacidadesDe(args).bash).toBe(true)
    expect(prompt).toContain('Tienes Bash')
    expect(prompt).not.toContain('NO tienes Bash')
  })

  it('las capacidades que recibe el constructor son las de los args que se lanzan', () => {
    for (const lanzar of [argsDeLectura, argsDelGenerador]) {
      const args = abre(lanzar((c) => JSON.stringify(c), '/p', '/grafo/turno'))
      expect(JSON.parse(textoDe(args))).toEqual(capacidadesDe(args))
    }
  })

  it('el modo lectura del Terminal niega Bash de verdad, y el bloque lo refleja', () => {
    const args = buildArgs('x', 'lectura', {}, null, 0)
    expect(capacidadesDe(args).bash).toBe(false)
    expect(bloqueDeCapacidades(capacidadesDe(args)).join(' ')).toContain('NO tienes Bash')
  })

  it('auditoria (el escaner) tiene Bash, y el bloque lo refleja', () => {
    const args = buildArgs('x', 'auditoria', {}, null, 0)
    expect(capacidadesDe(args).bash).toBe(true)
    expect(bloqueDeCapacidades(capacidadesDe(args)).join(' ')).toContain('Tienes Bash')
  })
})
