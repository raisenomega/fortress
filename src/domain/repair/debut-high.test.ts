import { describe, expect, it } from 'vitest'
import { isDebutEligible } from './debut'
import { selectTarget, surface, type Candidate } from './select-target'
import type { Severity } from '../shared/severity'

const candidate = (severity: Severity, title: string, file: string): Candidate => ({
  id: `${severity}:${file}`, severity, title, file, line: 1,
  firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'handleverify'
}) // prettier-ignore

/** El hallazgo real que motivo la ampliacion anterior: MEDIUM, aditivo, sup 1. */
const SSRF = candidate('MEDIUM', 'SSRF: el filtro de host privado no valida la IP resuelta por DNS', 'src/domain/posture/target-url.ts') // prettier-ignore
/** LOW pero reescritura: severidad menor NO significa fix mas contenido. */
const LOW_REESCRITURA = candidate('LOW', 'La API key del entorno se hereda a los scripts del repositorio auditado', 'src/infrastructure/probe/run-command.ts') // prettier-ignore

/**
 * ADR-106: el escalon de HIGH. Vive aparte de `debut.test.ts` porque son dos
 * sujetos —que severidades entran, y que gana cuando entran varias— y juntos
 * pasaban de 75 lineas.
 */
describe('el escalon de HIGH (ADR-106)', () => {
  it('un HIGH contenido ya entra, y gana a un MEDIUM igual de contenido', () => {
    const high = candidate('HIGH', 'el endpoint no valida el token', 'a.ts')

    expect(surface(high)).toBe(1)
    expect(surface(SSRF)).toBe(1)
    expect(isDebutEligible(high)).toBe(true)
    expect(selectTarget([SSRF, high])?.target.id).toBe(high.id)
  })

  it('el MEDIUM sigue ganando a un LOW que exige reescritura', () => {
    expect(surface(LOW_REESCRITURA)).toBeGreaterThan(surface(SSRF))
    expect(selectTarget([LOW_REESCRITURA, SSRF])?.target.id).toBe(SSRF.id)
  })
})
