import { describe, expect, it } from 'vitest'
import { esAveria, motivoDeAveria } from './averia'
import { fallaDelProveedor, sinRespuesta } from './falla-del-proveedor'
import { veredictoDelAnalisis } from './veredicto-del-analisis'
import type { Candidate } from './select-target'

const OBJETIVO: Candidate = { id: 'f1', severity: 'LOW', title: 't', file: 'a.ts', line: 1, firstSeen: '2026-10-05T00:00:00.000Z', tipo: null, simbolo: null } // prettier-ignore

describe('el analista que no llego a analizar porque el proveedor fallo', () => {
  const analisis = sinRespuesta(OBJETIVO, "429: You've reached your Fable limit")

  it('el analisis lleva la marca del proveedor, no la de ilegible', () => {
    expect(fallaDelProveedor(analisis)).toBe(true)
    expect(analisis.status).toBe('DESCONOCIDO')
  })

  it('su veredicto es PROVEEDOR y su motivo provider_error: una AVERIA', () => {
    const v = veredictoDelAnalisis(analisis)
    expect(v.verdict).toBe('PROVEEDOR')
    expect(v.state).toBe('RECHAZADO')
    expect(v.reason).toMatch(/^provider_error: 429/)
    expect(esAveria(motivoDeAveria(v.reason) ?? '')).toBe(true)
  })

  it('motivoDeAveria lee la clave de un motivo con detalle; un veredicto normal no es averia', () => {
    expect(motivoDeAveria('provider_error: 429: limite')).toBe('provider_error')
    expect(motivoDeAveria('cli_no_arranco: ENOENT')).toBe('cli_no_arranco')
    expect(motivoDeAveria('analisis_ilegible: texto')).toBeNull()
    expect(motivoDeAveria('gate_failed_at=lint')).toBeNull()
  })
})
