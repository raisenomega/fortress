import { describe, expect, it } from 'vitest'
import { PLANTILLA } from './cognition-fixture'
import { CON_DATOS } from './cognition-fixture-lleno'
import { parseCognitionLog } from './parse-cognition-log'

describe('parseCognitionLog sobre la plantilla sin rellenar', () => {
  const snapshot = parseCognitionLog(PLANTILLA)

  it('NO se inventa el mapa de atencion del bloque de ejemplo', () => {
    // Este es el fallo grave que el filtro existe para evitar: "src/auth/ 0.90"
    // es una linea de muestra del documento, no una medida del proyecto.
    expect(snapshot.attention).toEqual([])
  })

  it('NO cuenta la plantilla PTN-[ANO]-[NUMERO] como patron registrado', () => {
    expect(snapshot.patterns).toEqual([])
  })

  it('NO cuenta la plantilla de reflexion como una sesion real', () => {
    expect(snapshot.reflections).toEqual([])
  })

  it('lee la generacion, que si es un dato de verdad', () => {
    expect(snapshot.generation).toBe(0)
  })
})

describe('parseCognitionLog con datos reales', () => {
  const snapshot = parseCognitionLog(CON_DATOS)

  it('lee las zonas de atencion con su peso', () => {
    expect(snapshot.attention).toEqual([
      { zone: 'src/auth/', weight: 0.95, reason: 'Maneja autenticación' },
      { zone: 'src/utils/', weight: 0.2, reason: 'Sin errores en 90 días' }
    ])
  })

  it('lee los patrones con estado, severidad y recurrencias', () => {
    expect(snapshot.patterns).toHaveLength(2)
    expect(snapshot.patterns[0]).toMatchObject({
      id: 'PTN-2026-001',
      status: 'EXTINTO',
      severity: 'CRITICAL',
      recurrences: 3
    })
  })

  it('un patron sin fecha legible no la inventa', () => {
    expect(snapshot.patterns[1].detectedAt).toBeNull()
  })

  it('lee la reflexion con su fecha y proyecto', () => {
    expect(snapshot.reflections[0]).toMatchObject({ session: '2026-08-01', project: 'Nucleo' })
  })

  it('lee la generacion actual', () => {
    expect(snapshot.generation).toBe(2)
  })
})
