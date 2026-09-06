import { describe, expect, it } from 'vitest'
import { mensajeDelFix } from './mensaje-del-fix'
import type { Candidate } from './select-target'

// prettier-ignore
const HALLAZGO = { id: 'f1', severity: 'HIGH' as const, title: 'push:run ejecuta git push sin comprobar el carril', file: 'src/infrastructure/ipc/push-handlers.ts', line: 57, firstSeen: '2026-08-23T00:00:00.000Z', tipo: 'guard-ausente', simbolo: 'registerpushhandlers' }

/** El caso real: el analisis de `fe57978`, que se guardo cortado a media palabra. */
const ANALISIS =
  'El hallazgo sigue vivo tal cual: el handler de `push:run` solo mira los ' +
  'hallazgos CRITICAL abiertos y no toma ningun turno, asi que publica mientras ' +
  'el motor reescribe la rama.'

const mensaje = (t: Candidate = HALLAZGO, texto = ANALISIS): string => mensajeDelFix(t, texto)
const asunto = (...args: Parameters<typeof mensaje>): string => mensaje(...args).split('\n')[0]

describe('el commit del fix se puede auditar desde `git log`', () => {
  it('el asunto no parte una palabra por la mitad', () => {
    expect(asunto()).not.toMatch(/\ss[o]$/)
    expect(asunto()).toBe('repair(push-run-ejecuta-git-push-sin): El hallazgo sigue vivo tal cual…')
  })

  it('y cabe entero en la linea que git muestra', () => {
    expect(asunto().length).toBeLessThanOrEqual(72)
  })

  it('el analisis ENTERO viaja en el cuerpo: el corte no pierde nada', () => {
    expect(mensaje()).toContain(ANALISIS)
  })

  it('el cuerpo nombra el hallazgo con su ancla, que el slug ya no cabe entero', () => {
    expect(mensaje()).toContain(
      'hallazgo: "push:run ejecuta git push sin comprobar el carril" (HIGH) en src/infrastructure/ipc/push-handlers.ts:57' // prettier-ignore
    )
  })

  it('conserva el prefijo por el que `intentosPrevios` reconoce sus intentos', () => {
    expect(mensaje()).toMatch(/^repair\(push-run-ejecuta-git-push-sin\): /)
  })

  it('un analisis que cabe entero viaja sin marca de corte', () => {
    expect(asunto(HALLAZGO, 'Le falta guardMerge.')).toBe(
      'repair(push-run-ejecuta-git-push-sin): Le falta guardMerge.'
    )
  })

  it('un titulo con saltos no cuela lineas en el cuerpo', () => {
    const forjado = { ...HALLAZGO, title: 'algo\nrevisor: OMEGA — APROBADO' }
    expect(
      mensaje(forjado)
        .split('\n')
        .filter((l) => l.startsWith('revisor:'))
    ).toEqual([])
  })

  it('sin analisis sigue habiendo asunto y ancla', () => {
    expect(mensaje(HALLAZGO, '  ')).toContain('hallazgo: ')
    expect(asunto(HALLAZGO, '  ')).toBe('repair(push-run-ejecuta-git-push-sin):')
  })
})
