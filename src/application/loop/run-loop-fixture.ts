import { vi } from 'vitest'
import type { LoopDeps } from './loop-deps'

export const config = { projectId: 'p', costCap: 30, maxCycles: 5 }

/** Una vuelta que cerro una propuesta: lo normal, y lo que gasta tope. */
export const CERRADA = { kind: 'integrada', proposalId: 'prop-1' }
export const SIN_CANDIDATO = { kind: 'sin-candidato' }

/** Aprobada y sin integrar, con la condicion que freno (null: ni se miro). */
export const esperaFirma = (condition: string | null): unknown => ({
  kind: 'espera-firma',
  proposalId: 'prop-1',
  condition
})

export function deps(over: Partial<LoopDeps> = {}): LoopDeps {
  return {
    scan: vi.fn().mockResolvedValue(50),
    fix: vi.fn().mockResolvedValue(CERRADA),
    spentSession: () => 0,
    maxConsecutiveDenials: () => 5,
    // Cero = escanear en cada vuelta: el comportamiento previo a la cadencia,
    // que es la base contra la que se leen los testigos que no la miden.
    rescanEvery: () => 0,
    maxConsecutiveNoCandidates: () => 99,
    isCancelled: () => false,
    wait: () => Promise.resolve(),
    emit: () => {},
    persist: () => {},
    ...over
  }
}
