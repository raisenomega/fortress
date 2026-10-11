import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildArgs } from './claude-cli'

/** PASO 155 (FRONTERA): el CTO queda SIN herramientas por un disallow POR-RUN
 *  (merge generico en buildArgs); chat-libre, que comparte el modo 'libre', NO
 *  lo fija y CONSERVA su WebSearch. El candado ('libre') no se toca. */

const runCto = readFileSync('src/infrastructure/build/run-cto.ts', 'utf8')
const runLibre = readFileSync('src/infrastructure/build/run-libre.ts', 'utf8')

/** Las herramientas que buildArgs mete en --disallowedTools. */
function disallowDe(args: readonly string[]): readonly string[] {
  const i = args.indexOf('--disallowedTools')
  if (i < 0) return []
  const fin = args.findIndex((a, j) => j > i && a.startsWith('--'))
  return args.slice(i + 1, fin < 0 ? undefined : fin)
}

describe('CTO sin tools; chat-libre conserva su web (candado por-run)', () => {
  it('T1: el disallow por-run mete WebSearch en el carril del CTO', () => {
    const args = buildArgs('x', 'libre', {}, null, 0, null, false, [], null, ['WebSearch']).args
    expect(disallowDe(args)).toContain('WebSearch')
  })

  it('T2: sin disallow por-run (chat-libre), WebSearch NO se deniega y sigue permitida', () => {
    const args = buildArgs('x', 'libre', {}, null, 0).args
    expect(disallowDe(args)).not.toContain('WebSearch')
    expect(args).toContain('WebSearch')
  })

  it('T1/T2 pines: run-cto fija el disallow; run-libre NO lo toca', () => {
    expect(runCto).toContain("disallow: ['WebSearch']")
    expect(runLibre).not.toContain('disallow')
  })
})
