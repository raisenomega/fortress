import { describe, expect, it } from 'vitest'
import { countFindings } from '../project/severity-counts'
import { parseCognitionLog } from './parse-cognition-log'
import { rebuildLog } from './rebuild-log'
import type { DetectedFinding } from '../scan/detected-finding'

const ssrf: DetectedFinding = {
  severity: 'MEDIUM',
  title: 'SSRF: el filtro de host privado no valida la IP resuelta por DNS',
  file: 'src/domain/posture/target-url.ts',
  line: 33
}
const otro: DetectedFinding = {
  severity: 'LOW',
  title: 'La API key del entorno se hereda a los scripts',
  file: 'src/infrastructure/probe/run-command.ts',
  line: 22
}

const scan = (prev: string, open: DetectedFinding[], done: DetectedFinding[], at: string): string =>
  rebuildLog(prev, 'FCC', open, done, 90, countFindings(open), at)

const idOf = (log: string, title: string): string | undefined =>
  parseCognitionLog(log).patterns.find((p) => p.title === title)?.id

describe('rebuildLog: identidad de los patrones entre escaneos', () => {
  it('LO QUE IMPORTA: el mismo hallazgo conserva su id en dos escaneos seguidos', () => {
    const s1 = scan('', [ssrf, otro], [], '2026-08-08T10:00:00Z')
    const s2 = scan(s1, [ssrf, otro], [], '2026-08-09T10:00:00Z')
    expect(idOf(s2, ssrf.title)).toBe(idOf(s1, ssrf.title))
  })

  it('y lo conserva aunque cambie el ORDEN o desaparezcan otros hallazgos', () => {
    const s1 = scan('', [otro, ssrf], [], '2026-08-08T10:00:00Z')
    const s2 = scan(s1, [ssrf], [], '2026-08-09T10:00:00Z') // otro ya no esta
    expect(idOf(s2, ssrf.title)).toBe(idOf(s1, ssrf.title))
  })

  it('el id sobrevive al cambio de ano: se ancla a la primera deteccion', () => {
    const s1 = scan('', [ssrf], [], '2026-12-31T23:00:00Z')
    const s2 = scan(s1, [ssrf], [], '2027-01-01T01:00:00Z')
    expect(idOf(s2, ssrf.title)).toBe(idOf(s1, ssrf.title))
    expect(idOf(s2, ssrf.title)).toMatch(/^PTN-2026-/)
  })

  it('no pierde historia: la fecha de primera deteccion no se reescribe a hoy', () => {
    const s1 = scan('', [ssrf], [], '2026-08-01T10:00:00Z')
    const s2 = scan(s1, [ssrf], [], '2026-08-09T10:00:00Z')
    expect(s2).toContain('Primera deteccion: 2026-08-01')
    expect(s2).not.toContain('Primera deteccion: 2026-08-09')
  })

  it('al extinguirse conserva el id que tenia activo: es el mismo hallazgo', () => {
    const s1 = scan('', [ssrf], [], '2026-08-08T10:00:00Z')
    const activo = idOf(s1, ssrf.title)
    const s2 = scan(s1, [], [ssrf], '2026-08-09T10:00:00Z')
    expect(parseCognitionLog(s2).patterns[0].status).toBe('EXTINTO')
    expect(idOf(s2, ssrf.title)).toBe(activo)
  })

  it('dos extinciones en escaneos distintos NO colisionan (era el bug del 900)', () => {
    const s1 = scan('', [ssrf, otro], [], '2026-08-08T10:00:00Z')
    const s2 = scan(s1, [otro], [ssrf], '2026-08-09T10:00:00Z')
    const s3 = scan(s2, [], [otro], '2026-08-10T10:00:00Z')
    const extintos = parseCognitionLog(s3).patterns.filter((p) => p.status === 'EXTINTO')
    expect(extintos).toHaveLength(2)
    expect(new Set(extintos.map((p) => p.id)).size).toBe(2)
  })
})
