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
  firstSeen: '2026-01-01T00:00:00.000Z',
  tipo: 'path-traversal',
  simbolo: 'handleverify'
})

/** LOW pero reescritura: severidad menor NO significa fix mas contenido. Su
 *  hermano del escalon de HIGH vive en `debut-high.test.ts`. */
const LOW_REESCRITURA = candidate(
  'LOW',
  'La API key del entorno se hereda a los scripts del repositorio auditado',
  'src/infrastructure/probe/run-command.ts'
)

describe('modo estreno (que severidades puede tocar el motor)', () => {
  it('la escalera COMPLETA entra: CRITICAL subio el 2026-10-04 con la condicion cumplida', () => {
    for (const s of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const) {
      expect(isDebutEligible(candidate(s, 'sin guarda', 'a.ts'))).toBe(true)
    }
  })

  it('la escala esta cubierta entera: ninguna severidad queda sin decidir', () => {
    // Si manana se agrega una severidad nueva, este test obliga a clasificarla
    // a mano en vez de dejarla colarse (o quedarse fuera) por descuido.
    const dentro = SEVERITIES.filter((s) => isDebutEligible(candidate(s, 'sin guarda', 'a.ts')))
    expect([...dentro]).toEqual(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  })

  /**
   * ADR-106 invierte el criterio de arriba a proposito. Antes mandaba la
   * SUPERFICIE entre los elegibles, y con HIGH admitido eso habria dejado el
   * cambio sin efecto observable: el fix mas pequeno casi nunca es el mas grave,
   * asi que un HIGH admitido no habria salido elegido nunca.
   */
  it('la severidad ordena PRIMERO, aunque el grave sea el fix MAS GRANDE', () => {
    // El caso que prueba el orden nuevo: el HIGH exige reescritura (superficie
    // 11) y el LOW es agregar una guarda (1). Con el orden viejo ganaba el LOW.
    const grave = candidate('HIGH', 'el token se reescribe en cada turno', 'b.ts')
    const leve = candidate('LOW', 'sin guarda de concurrencia', 'a.ts')
    expect(surface(grave)).toBeGreaterThan(surface(leve))
    expect(selectTarget([leve, grave])?.target.id).toBe(grave.id)
  })

  it('con la severidad empatada, la superficie sigue desempatando', () => {
    expect(selectTarget([LOW_REESCRITURA, candidate('LOW', 'sin guarda', 'c.ts')])?.target.id).toBe('LOW:c.ts') // prettier-ignore
  })

  it('CRITICAL entra Y GANA: la condicion de su puerta se cumplio (9f69a37c/2655c77)', () => {
    const critico = candidate('CRITICAL', 'el endpoint no valida el token', 'a.ts')
    expect(selectTarget([critico])?.target.id).toBe(critico.id)
    expect(selectTarget([candidate('HIGH', 'sin guarda', 'b.ts'), critico])?.target.id).toBe(critico.id) // prettier-ignore
  })
})
