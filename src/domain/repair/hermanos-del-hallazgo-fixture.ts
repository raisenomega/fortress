import type { Hermano } from './hermanos-del-hallazgo'
import type { Candidate } from './select-target'

/** El caso real de mailbd: `send-invoice` con seis filas vivas para un defecto. */
// prettier-ignore
export const T: Candidate = { id: 'f1', severity: 'LOW', title: 'send-invoice envia correos sin ningun rate limiting', file: 'supabase/functions/send-invoice/index.ts', line: 258, firstSeen: '2026-08-18T00:00:00.000Z', tipo: 'rate-limit-ausente', simbolo: 'handler' }

/** Por defecto, uno de la misma sede y la misma clase; cada test cambia lo que prueba. */
// prettier-ignore
export const h = (id: string, o: Partial<Hermano> = {}): Hermano => ({ id, tipo: 'rate-limit-ausente', file: T.file, line: 268, title: `t-${id}`, simbolo: 'handler', firstSeen: '2026-09-08T00:00:00.000Z', ...o })

export const lineas = (texto: string | null): string[] => (texto ?? '').split('\n')
