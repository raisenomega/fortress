import type { Analyst } from '@domain/repair/analysis'
import { ILEGIBLE } from '@domain/repair/analysis-ilegible'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { FindingMemory } from '@domain/project/finding-memory'
import type { SelfNoteDraft } from '@domain/system/self-observation'

/** Un hallazgo ACTIVE y abierto, listo para ser candidato de C1. */
export function hallazgo(id: string, file: string): FindingMemory {
  return {
    id, identity: `LOW|${file}|t-${id}`, severity: 'LOW', title: `t-${id}`, file, line: 1,
    status: 'open', lifecycle: 'ACTIVE',
    firstSeen: '2026-08-08T10:00:00Z', lastSeen: '2026-08-08T10:00:00Z', resolvedAt: null, mitigatedAt: null
  } // prettier-ignore
}

/**
 * Analista doblado: devuelve el veredicto pedido y, si los hay, sus apuntes.
 *
 * `status: 'ILEGIBLE'` imita lo que deja el parser cuando la respuesta no se
 * dejo leer: `risk` con el prefijo y una cola de JSON truncado, como los tres
 * casos reales del 21 y el 23 de agosto.
 */
export function analistaFake(status: string, notes?: readonly SelfNoteDraft[]): Analyst {
  const risk = status === 'ILEGIBLE' ? `${ILEGIBLE}}  ]}` : 'riesgo bajo'
  return {
    study: (target) =>
      Promise.resolve({
        analysis: {
          target, status, whatToChange: 'w', where: 'd',
          patternToCopy: 'p', doNotTouch: 'n', risk, tokensUsed: 7,
          ...(notes ? { notes } : {})
        }, // prettier-ignore
        // Con factura, como la corrida real: sin ella no se asienta en el
        // libro mayor y no habria id que citar en el asiento del analista.
        runMeta: { tokensUsed: 7, durationMs: 99, startedAt: 1, endedAt: 100, usage: EMPTY_USAGE }
      })
  }
}
