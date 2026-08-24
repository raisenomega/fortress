import { describe, expect, it } from 'vitest'
import { esAveria, esEntorno } from './averia'
import { noArranco, sinProceso } from './cli-no-arranco'
import { isRetryable } from './retry-eligibility'
import type { Candidate } from './select-target'
import { veredictoDelAnalisis } from './veredicto-del-analisis'

// prettier-ignore
const TARGET: Candidate = { id: 'f1', severity: 'LOW', title: 't', file: 'a.ts', line: 1, firstSeen: '2026-08-01T00:00:00.000Z' }

describe('un CLI que no arranca NO es un analisis ilegible', () => {
  it('el veredicto lo nombra por lo que fue: no hubo proceso', () => {
    // Antes el analista resolvia con una cadena vacia y el parser la degradaba
    // a "no se dejo leer": el expediente juzgaba una respuesta inexistente.
    const v = veredictoDelAnalisis(sinProceso(TARGET, 'spawn claude ENOENT'))

    expect(v.verdict).toBe('NO_ARRANCO')
    expect(v.reason).toContain('cli_no_arranco')
    expect(v.reason).toContain('ENOENT')
    expect(v.reason).not.toContain('analisis_ilegible')
  })

  it('la propuesta se RECHAZA, no se caduca: el hallazgo no se ha mirado', () => {
    expect(veredictoDelAnalisis(sinProceso(TARGET, 'x')).state).toBe('RECHAZADO')
  })

  it('gana a la marca de ilegible, que supondria que hubo algo que leer', () => {
    expect(noArranco(sinProceso(TARGET, 'EACCES'))).toBe(true)
  })

  it('no rellena las cinco partes con prosa: que esten vacias es el dato', () => {
    const a = sinProceso(TARGET, 'x')
    expect([a.whatToChange, a.where, a.patternToCopy, a.doNotTouch]).toEqual(['', '', '', ''])
  })
})

describe('el trato: corta la tanda porque es la MAQUINA, pero no se reintenta', () => {
  it('corta: la vuelta siguiente fallaria identica', () => {
    expect(esAveria('cli_no_arranco')).toBe(true)
  })

  it('no se reintenta: esperar no crea un binario que falta', () => {
    expect(isRetryable('RECHAZADO', 'cli_no_arranco')).toBe(false)
    expect(isRetryable('RECHAZADO', 'cli_no_arranco: spawn ENOENT')).toBe(false)
  })

  it('se anuncia aparte de una caida del proveedor, con o sin sufijo', () => {
    expect(esEntorno('cli_no_arranco')).toBe(true)
    expect(esEntorno('cli_no_arranco: spawn claude ENOENT')).toBe(true)
    expect(esEntorno('provider_error')).toBe(false)
  })

  it('no-regresion: provider_error corta y reintenta; el reloj ni una cosa ni otra', () => {
    expect(esAveria('provider_error')).toBe(true)
    expect(isRetryable('RECHAZADO', 'provider_error')).toBe(true)
    expect(esAveria('generator_timeout')).toBe(false)
    expect(isRetryable('RECHAZADO', 'generator_timeout')).toBe(false)
  })
})
