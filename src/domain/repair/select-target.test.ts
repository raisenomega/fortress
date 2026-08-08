import { describe, expect, it } from 'vitest'
import { selectTarget, surface, type Candidate } from './select-target'

// Los 5 hallazgos reales del self-audit de FORTRESS.
const HIGH: Candidate = {
  id: 'h',
  severity: 'HIGH',
  title: 'preload expone process.env',
  file: 'src/preload/index.ts',
  line: 60
}
const MEDIUM: Candidate = {
  id: 'm',
  severity: 'MEDIUM',
  title: 'Renderer sin sandbox',
  file: 'src/infrastructure/electron/main-window.ts',
  line: 48
}
const FS: Candidate = {
  id: 'l1',
  severity: 'LOW',
  title: 'La guarda de path traversal es lexica y no resuelve symlinks',
  file: 'src/infrastructure/omega/fs-probe.ts',
  line: 10
}
const ACCOUNT: Candidate = {
  id: 'l2',
  severity: 'LOW',
  title: 'startLogin spawnea un proceso sin trackChild ni guarda de concurrencia',
  file: 'src/infrastructure/claude-code/claude-account.ts',
  line: 34
}
const POSTURE: Candidate = {
  id: 'l3',
  severity: 'LOW',
  title: 'El handler postureRun no pasa por guardRun: escaneos de red sin limite',
  file: 'src/infrastructure/ipc/posture-handlers.ts',
  line: 11
}
const ALL = [HIGH, MEDIUM, FS, ACCOUNT, POSTURE]

describe('selectTarget (C1 seleccion)', () => {
  it('modo estreno: solo considera LOW, nunca HIGH/MEDIUM (y sin LOW -> null)', () => {
    expect(selectTarget(ALL)?.target.severity).toBe('LOW')
    expect(selectTarget([HIGH, MEDIUM])).toBeNull()
  })

  it('determinista: mismo input en cualquier orden -> mismo elegido', () => {
    const a = selectTarget(ALL)
    const b = selectTarget([POSTURE, HIGH, ACCOUNT, MEDIUM, FS])
    const c = selectTarget([...ALL].reverse())
    expect(a?.target.id).toBe(b?.target.id)
    expect(a?.target.id).toBe(c?.target.id)
    expect(a?.target.id).toBe(POSTURE.id) // el mas contenido: guardRun aditivo, 1 concern
  })

  it('C1 NO propone ni edita: pura, devuelve solo {target, reason}, no muta el input', () => {
    const input = [...ALL]
    const sel = selectTarget(input)
    expect(Object.keys(sel ?? {}).sort()).toEqual(['reason', 'target']) // nada de fix/patch/edit
    expect(input).toEqual(ALL) // no muto el array de entrada
  })

  it('la superficie ordena: guardRun aditivo < trackChild (2 concerns) < path-traversal (reescritura)', () => {
    expect(surface(POSTURE)).toBeLessThan(surface(ACCOUNT))
    expect(surface(ACCOUNT)).toBeLessThan(surface(FS))
  })
})
