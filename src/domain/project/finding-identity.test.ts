import { describe, expect, it } from 'vitest'
import type { DetectedFinding } from '../scan/detected-finding'
import { patternId } from '../cognition/pattern-id'
import { fingerprintOf } from './finding-fingerprint'
import { findingIdentity } from './finding-identity'

const h = (extra: Partial<DetectedFinding>): DetectedFinding =>
  ({ severity: 'LOW', title: 't', file: 'src/a.ts', line: 1, ...extra }) as DetectedFinding

describe('el mismo defecto es una sola fila', () => {
  it('la redaccion y la severidad no parten la identidad', () => {
    const base = { file: 'src/g.ts', line: 43, tipo: 'missing-run-guard' as const }
    const primera = h({ ...base, severity: 'LOW', title: 'spawnea sin tope' })
    const ultima = h({ ...base, severity: 'MEDIUM', title: 'lanza el CLI sin guardRun' })

    expect(findingIdentity(primera)).toBe(findingIdentity(ultima))
  })

  it('el SIMBOLO ya no separa: era ruido, no discriminacion (ADR-084)', () => {
    // Los 40 duplicados que solo el simbolo mantenia aparte. Reales, del corpus:
    // `recordEvent` y `AuditService.recordEvent` son el MISMO defecto.
    const base = { file: 'services/audit.ts', line: 40, tipo: 'doc-contradice-codigo' as const }
    expect(findingIdentity(h({ ...base, simbolo: 'recordEvent' }))).toBe(
      findingIdentity(h({ ...base, simbolo: 'AuditService.recordEvent' }))
    )
    // Y el simbolo VACIO tampoco abre fila: `.env:9` entro dos veces por esto.
    expect(findingIdentity(h({ ...base, simbolo: '' }))).toBe(
      findingIdentity(h({ ...base, simbolo: 'SUPABASE_SERVICE_ROLE_KEY' }))
    )
  })

  it('la LINEA si separa, y hace el trabajo que se le atribuia al simbolo', () => {
    // handleVerify y handleAb eran el argumento para conservar el simbolo. Estan
    // en lineas distintas: la linea los separa sola, sin el simbolo.
    const base = { file: 'src/g.ts', tipo: 'missing-run-guard' as const }
    expect(findingIdentity(h({ ...base, line: 54 }))).not.toBe(
      findingIdentity(h({ ...base, line: 91 }))
    )
  })

  it('un defecto SIN linea vale `-`, y no colisiona con la linea 0', () => {
    // Las sondas emiten hallazgos sin linea a proposito: no es un hueco.
    const base = { file: 'src/a.ts', tipo: 'otro' as const }
    expect(findingIdentity(h({ ...base, line: null }))).toBe('src/a.ts|-|otro')
    expect(findingIdentity(h({ ...base, line: 0 }))).toBe('src/a.ts|0|otro')
  })

  it('sin tipo cae al fallback, sin fallar', () => {
    expect(findingIdentity(h({}))).toBe('src/a.ts|1|otro')
  })
})

describe('lo que la linea NO separa, lo separa el TIPO', () => {
  it('allowed-files.ts:45 son DOS defectos reales y siguen siendo dos filas', () => {
    // El unico sitio del corpus (366 hallazgos) con dos defectos reales en la
    // misma linea: la correa lexica que un symlink escapa, y que no resta los
    // innegociables. MISMO simbolo, asi que el simbolo tampoco los salvaba.
    const base = { file: 'src/domain/repair/allowed-files.ts', line: 45, simbolo: 'computeAllowedFiles' } // prettier-ignore
    expect(findingIdentity(h({ ...base, tipo: 'path-traversal' }))).not.toBe(
      findingIdentity(h({ ...base, tipo: 'validacion-asimetrica' }))
    )
  })
})

describe('lo que NO cambia', () => {
  it('el patron de COGNITION conserva su numeracion vieja', () => {
    expect(patternId({ severity: 'HIGH', file: 'src/a.ts', title: 'algo' }, '2026')).toBe(
      'PTN-2026-397217'
    )
  })

  it('la huella de los descartes sigue llevando severidad, linea y titulo', () => {
    expect(fingerprintOf(h({ line: 42 }))).toBe('LOW|src/a.ts|42|t')
  })
})
