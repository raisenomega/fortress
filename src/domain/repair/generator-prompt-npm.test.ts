import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import type { Analysis } from './analysis'
import { buildGeneratorPrompt } from './generator-prompt'

/**
 * ADR-111 pieza 3: el prompt OBLIGA la forma de npm cuando el fix es de
 * dependencias. El instinto del generador es `npm install` normal —medido el
 * 2026-10-02—, que la regla niega y el nativo mata: sin la instruccion, las
 * vueltas se queman en un camino sin salida.
 */
const dep: Analysis = {
  target: { id: 'f1', severity: 'HIGH', title: 'vitest con CVE', file: 'package.json', line: 81, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'dependencias', simbolo: 'vitest' }, // prettier-ignore
  status: 'REAL',
  whatToChange: 'subir vitest a la version parcheada',
  where: 'package.json',
  patternToCopy: '',
  doNotTouch: 'el resto de dependencias',
  risk: 'bajo',
  tokensUsed: 100
}
const FORMA = 'npm install <paquete>@<version> --save-dev --package-lock-only --ignore-scripts'

describe('la instruccion de npm del generador (ADR-111)', () => {
  it('ancla package.json + lock abierto por el grupo: la forma exacta, y el porque', () => {
    const p = buildGeneratorPrompt(dep, EMPTY_CORPUS, ['package.json'], ['package-lock.json'])
    expect(p).toContain(FORMA)
    expect(p).toContain('UNICA forma de npm pre-aprobada')
  })

  it('sin grupo declarado NO aparece: seria mandar a fabricar una violacion de correa', () => {
    expect(buildGeneratorPrompt(dep, EMPTY_CORPUS, ['package.json'])).not.toContain('npm install')
  })

  it('otro ancla NO la lleva, aunque un grupo tenga el lock abierto', () => {
    const otro: Analysis = { ...dep, target: { ...dep.target, file: 'src/a/b.ts' } }
    const p = buildGeneratorPrompt(otro, EMPTY_CORPUS, ['src/a/b.ts'], ['package-lock.json'])
    expect(p).not.toContain('npm install')
  })
})
