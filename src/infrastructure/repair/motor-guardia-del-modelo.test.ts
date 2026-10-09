import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, describe, expect, it } from 'vitest'
import { falloDeOmega } from '@application/repair/omega-autopsia'
import { motivoDelGenerador } from '@application/repair/motivo-del-generador'
import { esAveria } from '@domain/repair/averia'
import { veredictoDelAnalisis } from '@domain/repair/veredicto-del-analisis'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { modelosUsados } from '../claude-code/modelos-usados'
import { createGraphAnalyst } from './graph-analyst'
import { createGraphCritico } from './graph-critico'
import { createGraphGenerator } from './graph-generator'
import { toOmegaOutcome } from './omega-outcome'
import { relojDeCorrida } from './reloj-de-corrida'

afterAll(limpiarCarpetasDePrueba)

/** Una salida del CLI que corrio en `modelos` (el primero, principal). */
const salida = (result: string, ...modelos: string[]): string => JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result, num_turns: 2, usage: { input_tokens: 9, output_tokens: 9 }, modelUsage: Object.fromEntries(modelos.map((m, i) => [m, { outputTokens: 100 - i }])) }) // prettier-ignore
const claudeQueDevuelve = (json: string): string => {
  const bin = join(mkdtempSync(join(tmpdir(), 'fcc-modelo-')), 'claude')
  writeFileSync(bin, `#!/bin/sh\ncat >/dev/null\ncat <<'JSON'\n${json}\nJSON\nexit 0\n`)
  chmodSync(bin, 0o755)
  return bin
}
const VERDICT = 'VERDICT:{"resuelve_el_hallazgo":"SI","respeta_scope":"SI","respeta_doNotTouch":"SI","calidad_del_diff":"BUENO","riesgo_residual":"NINGUNO","veredicto_global":"APROBADO","razon":"correcto"}:END-VERDICT' // prettier-ignore
const meta = relojDeCorrida(0).meta // el reloj REAL: lleva el juicio a la factura, como produccion
// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'x' }

describe('el guardian del modelo, aplicado a los cuatro del Motor', () => {
  it('modelUsage se lee con el PRINCIPAL primero', () => {
    expect(modelosUsados(JSON.parse(salida('x', 'claude-opus-5-5', 'claude-haiku-4-5')))).toEqual(['claude-opus-5-5', 'claude-haiku-4-5']) // prettier-ignore
  })

  it('ANALISTA que corrio en Fable → modelo_no_asignado, AVERIA', async () => {
    const bin = claudeQueDevuelve(salida('{"status":"REAL","risk":"r"}', 'claude-fable-5'))
    const { analysis, runMeta } = await createGraphAnalyst(bin, carpetaDePrueba('.fortress-mod-'), 'p', true).study(TARGET, []) // prettier-ignore
    const v = veredictoDelAnalisis(analysis)
    expect(v.reason).toMatch(/^modelo_no_asignado: claude-fable-5/)
    expect(esAveria('modelo_no_asignado')).toBe(true)
    expect(runMeta.model).toBe('claude-fable-5')
  })

  it('OMEGA en sonnet → modelo_no_asignado; en opus con un 4-8 de fallback → APRUEBA con aviso', () => {
    const malo = toOmegaOutcome(salida(VERDICT, 'claude-sonnet-5-5'), meta)
    expect(malo).toMatchObject({ ok: false, error: 'modelo_no_asignado' })
    if (!malo.ok) expect(falloDeOmega(malo).reason).toBe('modelo_no_asignado')
    const bueno = toOmegaOutcome(salida(VERDICT, 'claude-opus-5-5', 'claude-opus-4-8'), meta)
    expect(bueno.ok).toBe(true)
    expect(bueno.runMeta.juicioModelo?.veredicto).toBe('aviso')
  })

  it('CRITICO en haiku → falla con modelo_no_asignado, no objeta', async () => {
    const r = await createGraphCritico(claudeQueDevuelve(salida('el fix esta mal', 'claude-haiku-4-5')), 'p', true).run(mkdtempSync(join(tmpdir(), 'fcc-arb-')), 'x') // prettier-ignore
    expect(r).toMatchObject({ ok: false, error: 'modelo_no_asignado' })
  })

  it('GENERADOR en Fable → falla, y su motivo es modelo_no_asignado', async () => {
    const r = await createGraphGenerator(claudeQueDevuelve(salida('hecho', 'claude-fable-5')), 'p', true).generate(carpetaDePrueba('.fortress-gen-'), 'x') // prettier-ignore
    expect(r.ok).toBe(false)
    if (!r.ok) expect(motivoDelGenerador(r)).toBe('modelo_no_asignado')
  })
})
