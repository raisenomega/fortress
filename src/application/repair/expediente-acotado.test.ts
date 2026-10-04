import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import type { HallazgoJuzgado } from '@domain/repair/hallazgo-juzgado'
import { buildOmegaInput } from './run-omega-inputs'

// prettier-ignore
const ANALISIS = { target: { id: 'f', severity: 'MEDIUM', title: 't', file: 'package.json', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'dependencia-vulnerable', simbolo: 'devDependencies' }, status: 'REAL', whatToChange: 'w', where: 'd', patternToCopy: '', doNotTouch: '', risk: 'bajo', tokensUsed: 0 } as unknown as HallazgoJuzgado

const GORDO = 'x'.repeat(370 * 1024)
const reads = {
  changedFiles: () => Promise.resolve(['package.json', 'package-lock.json']),
  diffText: () => Promise.resolve('el diff de 173 lineas'),
  readPost: (_w: string, p: string) => (p === 'package-lock.json' ? GORDO : 'post chico'),
  readPre: (_w: string, _b: string, p: string) =>
    Promise.resolve(p === 'package-lock.json' ? GORDO : 'pre chico')
}

/** DEUDAS §18: el expediente que OMEGA recibe acota los ficheros gordos en
 *  los DOS lados (pre y post); el diff y los chicos viajan enteros. */
describe('buildOmegaInput acota el expediente', () => {
  it('el lock sale como nota en pre Y en post; package.json entero; el diff intacto', async () => {
    const { input } = await buildOmegaInput(reads, '/wt', 'base', ANALISIS, EMPTY_CORPUS)
    const post = Object.fromEntries(input.filesPost.map((f) => [f.path, f.content]))
    const pre = Object.fromEntries(input.filesPre.map((f) => [f.path, f.content]))
    for (const lado of [post, pre]) {
      expect(lado['package-lock.json']).toContain('omitido por tamano (370 KB)')
      expect(lado['package-lock.json']).toContain('el diff muestra sus cambios')
      expect(lado['package-lock.json']?.length).toBeLessThan(200)
    }
    expect(post['package.json']).toBe('post chico')
    expect(pre['package.json']).toBe('pre chico')
    expect(input.diffText).toBe('el diff de 173 lineas')
  })
})
