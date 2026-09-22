import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import type { CognitionPattern } from '../cognition/cognition-log'
import { CON_BASH } from '../agent/capacidades-fixture'
import { buildAnalysisPrompt } from './analysis-prompt'
import { patternId } from '../cognition/pattern-id'
import { patronDelHallazgo } from './patron-del-hallazgo'
import type { Candidate } from './select-target'

// prettier-ignore
const HALLAZGO: Candidate = { id: 'f1', severity: 'MEDIUM', title: 'graph:verify lanza el CLI sin comprobar la confianza', file: 'src/infrastructure/ipc/graph-action-handlers.ts', line: 43, firstSeen: '2026-09-06T00:00:00.000Z', tipo: 'missing-trust-check', simbolo: 'handleverify' }

const patron = (extra: Partial<CognitionPattern>): CognitionPattern => ({
  id: patternId(HALLAZGO, '2026'),
  title: HALLAZGO.title,
  status: 'ACTIVE',
  severity: 'MEDIUM',
  detectedAt: '2026-08-23',
  recurrences: 3,
  ...extra
})

const linea = (...patrones: CognitionPattern[]): string =>
  patronDelHallazgo(HALLAZGO, patrones).join('\n')

describe('el analista recibe lo que el COGNITION-LOG ya sabia del hallazgo', () => {
  it('lo empareja por el sufijo del id, que sale del propio hallazgo', () => {
    expect(linea(patron({}))).toContain(`${patternId(HALLAZGO, '2026')}: ACTIVE`)
    expect(linea(patron({}))).toContain('3 veces')
    expect(linea(patron({}))).toContain('desde 2026-08-23')
  })

  it('el ano del id no impide el emparejamiento: se compara el sufijo', () => {
    expect(linea(patron({ id: patternId(HALLAZGO, '2025') }))).toContain('ACTIVE')
  })

  it('un patron dado por EXTINTO llega con el aviso de extincion falsa', () => {
    expect(linea(patron({ status: 'EXTINTO' }))).toContain('extincion fue falsa')
  })

  it('sin patron que case, no se dice nada: no se inventa historia', () => {
    expect(patronDelHallazgo(HALLAZGO, [])).toEqual([])
    expect(patronDelHallazgo(HALLAZGO, [patron({ id: 'PTN-2026-000001' })])).toEqual([])
  })

  it('y llega al prompt, que es el unico sitio donde sirve de algo', () => {
    const p = buildAnalysisPrompt(HALLAZGO, EMPTY_CORPUS, [], 'g', CON_BASH, [patron({})])

    expect(p).toContain('En el COGNITION-LOG del proyecto este hallazgo es PTN-')
    // Sin patrones el prompt no cambia: no se afirma historia que no consta.
    expect(buildAnalysisPrompt(HALLAZGO, EMPTY_CORPUS, [], 'g', CON_BASH)).not.toContain(
      'COGNITION-LOG'
    )
  })

  it('los campos que el log no trae no dejan huecos raros en la frase', () => {
    const parcial = linea(patron({ recurrences: null, detectedAt: null }))
    expect(parcial).toContain('es PTN-2026-')
    expect(parcial).not.toContain('null')
  })
})
