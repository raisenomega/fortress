import { describe, expect, it } from 'vitest'
import { selectTarget, surface, type Candidate } from './select-target'
import type { Severity } from '../shared/severity'

const VISTO = '2026-01-01T00:00:00.000Z'
const at = (id: string, severity: Severity, title: string, file: string, line: number): Candidate => ({ id, severity, title, file, line, firstSeen: VISTO }) // prettier-ignore

// Los 5 hallazgos reales del self-audit de FORTRESS.
const HIGH = at('h', 'HIGH', 'preload expone process.env', 'src/preload/index.ts', 60)
const MEDIUM = at('m', 'MEDIUM', 'Renderer sin sandbox', 'src/infrastructure/electron/main-window.ts', 48) // prettier-ignore
const FS = at('l1', 'LOW', 'La guarda de path traversal es lexica y no resuelve symlinks', 'src/infrastructure/omega/fs-probe.ts', 10) // prettier-ignore
const ACCOUNT = at('l2', 'LOW', 'startLogin spawnea un proceso sin trackChild ni guarda de concurrencia', 'src/infrastructure/claude-code/claude-account.ts', 34) // prettier-ignore
const POSTURE = at('l3', 'LOW', 'El handler postureRun no pasa por guardRun: escaneos de red sin limite', 'src/infrastructure/ipc/posture-handlers.ts', 11) // prettier-ignore
const ALL = [HIGH, MEDIUM, FS, ACCOUNT, POSTURE]

describe('selectTarget (C1 seleccion)', () => {
  it('modo estreno: MEDIUM entra, HIGH no (sin elegibles -> null)', () => {
    expect(selectTarget([HIGH, MEDIUM])?.target.id).toBe(MEDIUM.id)
    expect(selectTarget([HIGH])).toBeNull()
  })

  it('determinista: mismo input en cualquier orden -> mismo elegido', () => {
    const a = selectTarget(ALL)
    const b = selectTarget([POSTURE, HIGH, ACCOUNT, MEDIUM, FS])
    const c = selectTarget([...ALL].reverse())
    expect(a?.target.id).toBe(b?.target.id)
    expect(a?.target.id).toBe(c?.target.id)
    expect(a?.target.id).toBe(MEDIUM.id) // aditivo de 1 control: la menor superficie
  })

  it('C1 NO propone ni edita: pura, devuelve solo {target, reason}, no muta el input', () => {
    const input = [...ALL]
    const sel = selectTarget(input)
    expect(Object.keys(sel ?? {}).sort()).toEqual(['reason', 'target']) // nada de fix/patch/edit
    expect(input).toEqual(ALL) // no muto el array de entrada
  })

  it('empatados en superficie y fecha, desempata la carpeta menos cargada', () => {
    // POSTURE y FS son ambos aditivos de 1 control y se vieron el mismo dia:
    // empatan a superficie 1 y a antiguedad. Cada uno es el unico de su carpeta,
    // asi que tambien empatan en carga y cierra el orden el resto de criterios.
    // El detalle de surface() vive en surface.test.ts; el del reparto, en
    // selector-diversidad.test.ts.
    expect(surface(POSTURE)).toBe(surface(FS))
    expect(selectTarget([FS, POSTURE])?.target.id).toBe(POSTURE.id)
    expect(selectTarget([POSTURE, FS])?.target.id).toBe(POSTURE.id)
  })
})
