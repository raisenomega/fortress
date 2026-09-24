import { describe, expect, it } from 'vitest'
import type { NewOmegaEntry } from '@domain/omega/omega-entry'
import type { Project } from '@domain/project/project'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { AppContext } from '../context'
import { asentarSeveridadDerivada } from './asentar-severidad'

const PROJECT = { id: 'p1', name: 'P' } as Project
// prettier-ignore
const derivado: DetectedFinding = {
  severity: 'CRITICAL', title: 'precio', file: 'f.ts', line: 3,
  alcance: 'anonimo', efecto: 'dinero', estado: 'explotable-hoy', severidadDelModelo: 'HIGH'
}
// prettier-ignore
const familia: DetectedFinding = {
  severity: 'LOW', title: 'contraste', file: 'theme.css', line: 23, tipo: 'accesibilidad', ejesNoAplican: true
}

describe('las familias de auditoria se cuentan aparte en la nota (ADR-103 §2)', () => {
  it('van con su palabra: ni son sin-ejes ni entran en la evidencia de calibracion', () => {
    const asientos: NewOmegaEntry[] = []
    const context = { omegaLog: { append: (e: NewOmegaEntry) => (asientos.push(e), e) } } as unknown as AppContext // prettier-ignore

    asentarSeveridadDerivada(context, PROJECT, [derivado, familia])

    expect(asientos).toHaveLength(1)
    expect(asientos[0].summary).toContain('0 sin ejes')
    expect(asientos[0].summary).toContain('1 de auditoria con su palabra')
    expect(asientos[0].evidence).not.toContain('theme.css')
  })
})
