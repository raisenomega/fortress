import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { takeSnapshot } from './snapshot'
import { verify } from './verify'

// Capa 3 aislada: si la restauracion (Capa 2) NO ocurre, la verificacion
// independiente re-mide desde cero y detecta la diferencia. Asi la Capa 4 se
// entera aunque la Capa 2 tuviera un bug: el guard no se cree a si mismo.
describe('verify (Capa 3)', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'vfy-'))
    writeFileSync(join(dir, 'a.ts'), 'original')
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('sin cambios -> limpio', () => {
    const snap = takeSnapshot(dir)
    expect(verify(dir, snap).clean).toBe(true)
  })

  it('archivo modificado NO restaurado -> violacion forense con hash antes/despues', () => {
    const snap = takeSnapshot(dir)
    writeFileSync(join(dir, 'a.ts'), 'MANIPULADO') // simula restauracion fallida
    const report = verify(dir, snap)
    expect(report.clean).toBe(false)
    expect(report.violations[0].kind).toBe('modified')
    expect(report.violations[0].path).toBe('a.ts')
    expect(report.violations[0].before).not.toBe(report.violations[0].after)
  })

  it('archivo nuevo no barrido -> violacion "created"', () => {
    const snap = takeSnapshot(dir)
    writeFileSync(join(dir, 'nuevo.ts'), 'x')
    const report = verify(dir, snap)
    expect(report.clean).toBe(false)
    expect(report.violations.some((v) => v.kind === 'created' && v.path === 'nuevo.ts')).toBe(true)
  })
})
