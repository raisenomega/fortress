import { describe, expect, it } from 'vitest'
import type { NewOmegaEntry } from '@domain/omega/omega-entry'
import type { Project } from '@domain/project/project'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { AppContext } from '../context'
import { asentarSeveridadDerivada } from './asentar-severidad'

const PROJECT = { id: 'p1', name: 'P' } as Project

function contexto(rompe = false): { context: AppContext; asientos: NewOmegaEntry[] } {
  const asientos: NewOmegaEntry[] = []
  const append = (e: NewOmegaEntry): NewOmegaEntry => {
    if (rompe) throw new Error('el Libro no escribe')
    asientos.push(e)
    return e
  }
  return { context: { omegaLog: { append } } as unknown as AppContext, asientos }
}

/** Un hallazgo derivado: la tabla dijo CRITICAL donde el modelo dijo HIGH. */
// prettier-ignore
const derivado = (over: Partial<DetectedFinding> = {}): DetectedFinding => ({
  severity: 'CRITICAL', title: 'precio', file: 'f.ts', line: 3,
  alcance: 'anonimo', efecto: 'dinero', estado: 'explotable-hoy', severidadDelModelo: 'HIGH', ...over
})

describe('asentarSeveridadDerivada: la discrepancia modelo-vs-tabla, en el Libro', () => {
  it('una discrepancia: un asiento nota/info del escaner, con sitio, salto y ejes', () => {
    const { context, asientos } = contexto()

    asentarSeveridadDerivada(context, PROJECT, [derivado()])

    expect(asientos).toHaveLength(1)
    expect(asientos[0]).toMatchObject({ projectId: 'p1', agentId: 'security-reviewer', kind: 'nota', verdict: 'info' }) // prettier-ignore
    expect(asientos[0].summary).toContain('1 de 1 con ejes difieren')
    expect(asientos[0].evidence).toBe('f.ts:3 HIGH→CRITICAL (anonimo·dinero·explotable-hoy)')
  })

  it('sin discrepancia ni sin-ejes no se asienta nada', () => {
    const { context, asientos } = contexto()

    asentarSeveridadDerivada(context, PROJECT, [derivado({ severidadDelModelo: 'CRITICAL' })])

    expect(asientos).toEqual([])
  })

  it('los que vinieron sin ejes se cuentan: es la otra cara de la calibracion', () => {
    const { context, asientos } = contexto()
    const sinEjes: DetectedFinding = { severity: 'LOW', title: 't', file: 'g.ts', line: null, sinEjes: true } // prettier-ignore

    asentarSeveridadDerivada(context, PROJECT, [sinEjes])

    expect(asientos[0].summary).toContain('0 de 0 con ejes difieren')
    expect(asientos[0].summary).toContain('1 sin ejes')
  })

  it('un asiento por escaneo, no por hallazgo', () => {
    const { context, asientos } = contexto()

    asentarSeveridadDerivada(context, PROJECT, [derivado(), derivado({ file: 'h.ts' }), derivado({ line: 9 })]) // prettier-ignore

    expect(asientos).toHaveLength(1)
    expect(asientos[0].evidence?.split('; ')).toHaveLength(3)
  })

  it('si el Libro falla, el escaneo no: mejor esfuerzo', () => {
    const { context } = contexto(true)
    expect(() => asentarSeveridadDerivada(context, PROJECT, [derivado()])).not.toThrow()
  })
})
