import { avisoDeHerencia } from '@domain/repair/aviso-de-herencia'
import type { GateOutcome } from '@domain/repair/gate-result'

/** Lo no verificado y lo que ya venia roto, en la evidencia y solo si los hubo:
 *  el libro no afirma "no hubo" cuando la pregunta no aplicaba. */
export const anotaciones = (o: GateOutcome): Record<string, readonly string[]> => ({
  ...(o.skipped?.length ? { skipped: o.skipped } : {}),
  ...(o.heredado?.length ? { heredado: o.heredado } : {})
})

/**
 * La RAZON con la que el verde entra en el libro. No es un detalle de formato:
 * es la UNICA linea del gate que el operador lee en la fila de Firma sin abrir
 * nada, y la que queda escrita para siempre. «gate verde» a secas es lo que
 * dejo firmar ocho fixes con los tests absueltos (DEUDAS §11.6).
 */
export function razonDelVerde(outcome: GateOutcome): string {
  const aviso = avisoDeHerencia(outcome.heredado)
  return aviso === null ? 'gate verde' : `gate verde — ${aviso}`
}
