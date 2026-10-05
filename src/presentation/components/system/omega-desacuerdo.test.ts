import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import { desacuerdoDe } from './desacuerdo-de-omega'
import { OmegaVerdictTable } from './OmegaVerdictTable'

/**
 * ADR-115 A3. El veredicto que DECLARO el agente de OMEGA y el que CALCULARON las
 * reglas (D19) se asientan aparte (`omega_verdict_mismatch`), y la tabla de la
 * transicion ya trae el global sobrescrito por las reglas: nadie veia el veto.
 * Es `.test.ts` y no `.tsx` porque el gate solo incluye `src/**\/*.test.ts`.
 */
const PARCIAL = { resuelve_el_hallazgo: 'PARCIAL', respeta_scope: 'SI', respeta_doNotTouch: 'SI', calidad_del_diff: 'ACEPTABLE', riesgo_residual: 'MENOR', veredicto_global: 'APROBADO', razon: 'r' } as const // prettier-ignore
type Desacuerdo = { readonly agentSaid: string; readonly rulesSay: string }
const pintar = (verdict: typeof PARCIAL | { [k: string]: string }, desacuerdo?: Desacuerdo): string =>
  renderToStaticMarkup(createElement(OmegaVerdictTable, { verdict: verdict as typeof PARCIAL, desacuerdo })) // prettier-ignore

/** El HTML EXACTO de la tabla antes de A3, fotografiado del codigo de main@ebc7b3e. */
const ANTES = '<div class="border-border/60 my-1 rounded border px-2 py-1"><div class="flex items-center gap-2 text-[11px]"><span class="text-muted-foreground w-40">resuelve el hallazgo</span><span class="text-medium">PARCIAL</span></div><div class="flex items-center gap-2 text-[11px]"><span class="text-muted-foreground w-40">respeta scope</span><span class="text-success">SI</span></div><div class="flex items-center gap-2 text-[11px]"><span class="text-muted-foreground w-40">respeta doNotTouch</span><span class="text-success">SI</span></div><div class="flex items-center gap-2 text-[11px]"><span class="text-muted-foreground w-40">calidad del diff</span><span class="text-muted-foreground">ACEPTABLE</span></div><div class="flex items-center gap-2 text-[11px]"><span class="text-muted-foreground w-40">riesgo residual</span><span class="text-muted-foreground">MENOR</span></div><div class="flex items-center gap-2 text-[11px]"><span class="text-muted-foreground w-40">veredicto global</span><span class="text-success">APROBADO</span></div><p class="text-foreground mt-1 text-[11px]">r</p></div>' // prettier-ignore
const FILA_DEL_AGENTE = '<div class="flex items-center gap-2 text-[11px]"><span class="text-muted-foreground w-40">el agente declaro</span><span class="text-critical">VETADO</span></div>' // prettier-ignore
const VETO = { agentSaid: 'VETADO', rulesSay: 'APROBADO' }

describe('la firma ve el desacuerdo de OMEGA (73cb105c: el agente veto, las reglas aprobaron)', () => {
  it('una fila mas, con el formato exacto de las otras, justo bajo el veredicto global', () => {
    expect(pintar(PARCIAL, VETO)).toBe(ANTES.replace('<p class=', `${FILA_DEL_AGENTE}<p class=`))
  })

  it('sin desacuerdo, la tabla es IDENTICA a la de antes, byte a byte', () => {
    expect(pintar(PARCIAL)).toBe(ANTES)
  })

  it('en la tabla del propio agente no se repite: solo donde mandan las reglas', () => {
    expect(pintar({ ...PARCIAL, veredicto_global: 'VETADO' }, VETO)).not.toContain(
      'el agente declaro'
    )
  })
})

const ev = (reason: string, evidence: object): ProposalEvent => ({ id: reason, proposalId: 'p', seq: 1, ts: 0, phase: 'OMEGA', eventType: 'DECISION', actor: 'motor', reason, evidenceJson: JSON.stringify(evidence) }) as unknown as ProposalEvent // prettier-ignore

describe('el libro de la propuesta entrega el desacuerdo a la tabla', () => {
  it('lo saca del evento omega_verdict_mismatch', () => {
    expect(desacuerdoDe([ev('gate verde', {}), ev('omega_verdict_mismatch', VETO)])).toEqual(VETO)
  })

  it('sin ese evento, o con su evidencia rota, no hay desacuerdo', () => {
    expect(desacuerdoDe([ev('omega aprobo', {})])).toBeNull()
    expect(
      desacuerdoDe([{ ...ev('omega_verdict_mismatch', {}), evidenceJson: '{roto' }])
    ).toBeNull()
  })
})

/** El cableado: la fila esconde la tabla tras «evidencia» y sin DOM no se pulsa,
 *  asi que se guarda por el texto, como los demas tests de esta carpeta. */
describe('el desacuerdo viaja de la lista a la tabla', () => {
  const leer = (f: string): string =>
    readFileSync(`src/presentation/components/system/${f}`, 'utf8')
  it('la lista lo saca del libro y la fila se lo pasa a la tabla', () => {
    expect(leer('ProposalEventList.tsx')).toMatch(
      /desacuerdo=\{desacuerdoDe\(events\)\}|desacuerdo=\{desacuerdo\}/
    )
    expect(leer('ProposalEventRow.tsx')).toContain(
      '<OmegaVerdictTable verdict={verdict} desacuerdo={desacuerdo} />'
    )
  })
})
