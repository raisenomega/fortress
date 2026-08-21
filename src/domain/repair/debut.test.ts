import { describe, expect, it } from 'vitest'
import { selectTarget, surface, type Candidate } from './select-target'
import { isDebutEligible } from './debut'
import { SEVERITIES, type Severity } from '../shared/severity'

const candidate = (severity: Severity, title: string, file: string): Candidate => ({
  id: `${severity}:${file}`,
  severity,
  title,
  file,
  line: 1,
  firstSeen: '2026-01-01T00:00:00.000Z'
})

/** El hallazgo real que motivo la ampliacion: MEDIUM, aditivo, superficie 1. */
const SSRF = candidate(
  'MEDIUM',
  'SSRF: el filtro de host privado no valida la IP resuelta por DNS',
  'src/domain/posture/target-url.ts'
)
/** LOW pero reescritura: severidad menor NO significa fix mas contenido. */
const LOW_REESCRITURA = candidate(
  'LOW',
  'La API key del entorno se hereda a los scripts del repositorio auditado',
  'src/infrastructure/probe/run-command.ts'
)

describe('modo estreno (que severidades puede tocar el motor)', () => {
  it('LOW y MEDIUM entran; HIGH y CRITICAL siguen fuera', () => {
    expect(isDebutEligible(candidate('LOW', 'sin guarda', 'a.ts'))).toBe(true)
    expect(isDebutEligible(candidate('MEDIUM', 'sin guarda', 'a.ts'))).toBe(true)
    expect(isDebutEligible(candidate('HIGH', 'sin guarda', 'a.ts'))).toBe(false)
    expect(isDebutEligible(candidate('CRITICAL', 'sin guarda', 'a.ts'))).toBe(false)
  })

  it('la escala esta cubierta entera: ninguna severidad queda sin decidir', () => {
    // Si manana se agrega una severidad nueva, este test obliga a clasificarla
    // a mano en vez de dejarla colarse (o quedarse fuera) por descuido.
    const dentro = SEVERITIES.filter((s) => isDebutEligible(candidate(s, 'sin guarda', 'a.ts')))
    expect([...dentro]).toEqual(['MEDIUM', 'LOW'])
  })

  it('el SSRF (MEDIUM) ya es elegible y gana a un LOW que exige reescritura', () => {
    expect(isDebutEligible(SSRF)).toBe(true)
    expect(surface(SSRF)).toBe(1)
    expect(surface(LOW_REESCRITURA)).toBeGreaterThan(surface(SSRF))
    expect(selectTarget([LOW_REESCRITURA, SSRF])?.target.id).toBe(SSRF.id)
  })

  it('la severidad NO ordena: entre elegibles manda la superficie', () => {
    const medium = candidate('MEDIUM', 'el handler no valida el origen', 'b.ts')
    const low = candidate('LOW', 'el score se calcula dos veces', 'a.ts')
    expect(selectTarget([low, medium])?.target.id).toBe(medium.id)
  })

  it('un HIGH aditivo y contenido sigue sin entrar: el estreno es por confianza', () => {
    const high = candidate('HIGH', 'el endpoint no valida el token', 'a.ts')
    expect(surface(high)).toBe(1) // contenido, pero fuera del estreno
    expect(selectTarget([high])).toBeNull()
  })
})
