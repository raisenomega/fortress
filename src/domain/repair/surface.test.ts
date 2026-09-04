import { describe, expect, it } from 'vitest'
import { surface, type Candidate } from './select-target'

const at = (title: string, file: string): Candidate => ({
  id: file,
  severity: 'MEDIUM',
  title,
  file,
  line: 1,
  firstSeen: '2026-01-01T00:00:00.000Z',
  tipo: 'path-traversal',
  simbolo: 'handleverify'
})

/** Los dos que la heuristica vieja penalizaba con superficie 11. */
const SSRF = at(
  'SSRF: el filtro de host privado no valida la IP resuelta por DNS',
  'src/domain/posture/target-url.ts'
)
const LOOP = at(
  'El loop autonomo no verifica trusted en el main y revocar la confianza no lo detiene',
  'src/infrastructure/loop/loop-engine.ts'
)
/** Aditivo de dos controles: "sin trackChild NI guarda de concurrencia". */
const DOS_CONTROLES = at(
  'startLogin spawnea un proceso sin trackChild ni guarda de concurrencia',
  'src/infrastructure/claude-code/claude-account.ts'
)
/** Sin marca de ausencia: exige reescribir como se construye el entorno. */
const REESCRITURA = at(
  'La API key del entorno se hereda a los scripts del repositorio auditado',
  'src/infrastructure/probe/run-command.ts'
)

/** Frontera entre aditivo y reescritura: la penalizacion de 10 de surface(). */
const REESCRITURA_MIN = 10

describe('surface (C1: superficie de cambio estimada)', () => {
  it('REGRESION: SSRF y loop-engine puntuan como aditivos, no como reescrituras', () => {
    // Antes del fix ambos daban 11 (10 de penalizacion + 1 concern) y el
    // selector los mandaba al fondo de la cola para siempre.
    expect(surface(SSRF)).toBeLessThan(REESCRITURA_MIN)
    expect(surface(LOOP)).toBeLessThan(REESCRITURA_MIN)
    expect(surface(SSRF)).toBe(1)
    expect(surface(LOOP)).toBe(1)
  })

  it('una reescritura sigue puntuando por encima de la frontera', () => {
    expect(surface(REESCRITURA)).toBeGreaterThan(REESCRITURA_MIN)
  })

  it('entre aditivos ordena por numero de controles a agregar', () => {
    expect(surface(SSRF)).toBeLessThan(surface(DOS_CONTROLES))
    expect(surface(DOS_CONTROLES)).toBe(2)
  })

  it('cualquier aditivo, por muchos controles que pida, gana a una reescritura', () => {
    expect(surface(DOS_CONTROLES)).toBeLessThan(surface(REESCRITURA))
  })
})
