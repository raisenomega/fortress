import { describe, expect, it } from 'vitest'
import { DEFAULT_POLICY } from './auto-merge-policy'
import { DEBUT, isDebutEligible } from './debut'
import { selectTarget, type Candidate } from './select-target'

/**
 * El ultimo escalon de la escalera (firma del operador, 2026-10-04): DEBUT
 * sube a CRITICAL porque la condicion de ADR-106 §3.3 se CUMPLIO — el HIGH
 * 9f69a37c (nacido el 3-oct, posterior al sello) paso gate verde + OMEGA
 * aprobo + integracion firmada (merge 2655c77), verificado asiento a asiento.
 */
const c = (id: string, severity: Candidate['severity']): Candidate =>
  ({ id, severity, title: 't', file: `src/${id}.ts`, line: 1, firstSeen: '2026-10-01T00:00:00.000Z', tipo: 'missing-trust-check', simbolo: 'x' }) // prettier-ignore

describe('el escalon CRITICAL (ADR-106 §3.3, cumplida y firmada)', () => {
  it('DEBUT incluye CRITICAL: la escalera completa, cada escalon pagado', () => {
    expect(DEBUT).toEqual(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    expect(isDebutEligible(c('a', 'CRITICAL'))).toBe(true)
  })

  it('la seleccion ELIGE el CRITICAL el primero: la autoridad de severidad manda', () => {
    const sel = selectTarget([c('low', 'LOW'), c('crit', 'CRITICAL'), c('high', 'HIGH')])
    expect(sel?.target.id).toBe('crit')
  })

  it('CRITICAL JAMAS se auto-integra: la politica por defecto no lo lista', () => {
    // La subida abre sobre QUE trabaja el motor; integrar sigue siendo la
    // firma del operador (el mismo cerrojo que ADR-106 dejo para HIGH).
    expect(DEFAULT_POLICY.severities).toEqual(['LOW', 'MEDIUM'])
    expect(DEFAULT_POLICY.severities).not.toContain('CRITICAL')
    expect(DEFAULT_POLICY.severities).not.toContain('HIGH')
  })
})
