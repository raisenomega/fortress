import { describe, expect, it } from 'vitest'
import { esAveria } from '@domain/repair/averia'
import type { ProposalState } from '@domain/repair/proposal'
import { isRetryable } from '@domain/repair/retry-eligibility'
import { banco, PRODUCIDO, type Banco } from './verify-and-commit-fixture'
import { verifyAndCommit } from './verify-and-commit'

const corrida = (state: ProposalState): Banco => banco(state)

describe('una transicion ilegal es un bug NUESTRO, no un fallo del generador', () => {
  it('sale como invalid_state, jamas como generator_error', async () => {
    // El generador acaba de entregar su fix: paso la correa, paso el
    // presupuesto y confirmo el commit. Acusarle a el de que nuestra maquina de
    // estados diga que no es culpar al unico que no fallo.
    const b = corrida('CADUCADO')
    const r = await verifyAndCommit(b.ctx, b.admitido, b.deps, b.fail, PRODUCIDO)

    expect(r).toMatchObject({ ok: false, reason: 'invalid_state' })
    expect(r).not.toMatchObject({ reason: 'generator_error' })
  })

  it('NO responde a una transicion ilegal ejecutando otra a ciegas', async () => {
    // `fail` escribe RECHAZADO sin comprobar si esa transicion es legal. Desde
    // un estado terminal eso era el remedio repitiendo la enfermedad.
    const b = corrida('CADUCADO')
    await verifyAndCommit(b.ctx, b.admitido, b.deps, b.fail, PRODUCIDO)

    expect(b.patches).toEqual([])
    expect(b.fallos).toEqual([])
  })

  it('el camino legal sigue intacto: ANALIZADO si avanza a GENERADO', async () => {
    const b = corrida('ANALIZADO')
    const r = await verifyAndCommit(b.ctx, b.admitido, b.deps, b.fail, PRODUCIDO)

    expect(r).toMatchObject({ ok: true })
    expect(b.patches[0]).toMatchObject({ state: 'GENERADO' })
  })
})

describe('el trato de invalid_state, alineado con el hermano runGate', () => {
  it('no es averia del proveedor: la tanda sigue con el expediente siguiente', () => {
    // Es una condicion DE ESTE expediente, no del entorno. Cortar el pozo por
    // una fila mal puesta seria cerrar la tanda por algo que no se repite.
    expect(esAveria('invalid_state')).toBe(false)
  })

  it('no se reintenta: repetir con el mismo estado da lo mismo', () => {
    expect(isRetryable('RECHAZADO', 'invalid_state')).toBe(false)
  })
})

describe('generator_error queda sin emisor, y su clasificacion se retira', () => {
  it('ya no se clasifica como averia: nadie lo produce', () => {
    expect(esAveria('generator_error')).toBe(false)
  })

  it('los dos que SI existen siguen intactos', () => {
    expect(esAveria('provider_error')).toBe(true)
    expect(esAveria('generator_timeout')).toBe(false)
    expect(isRetryable('RECHAZADO', 'provider_error')).toBe(true)
    expect(isRetryable('RECHAZADO', 'generator_timeout')).toBe(false)
  })
})
