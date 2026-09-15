import type { Finding } from '@domain/project/finding'
import type { FindingMemory } from '@domain/project/finding-memory'

interface EnDosVistas {
  readonly memoria: FindingMemory
  readonly fila: Finding
}

/** Un hallazgo en las DOS vistas de la base: la memoria del motor y la fila. */
function hallazgo(
  id: string,
  file: string,
  title: string,
  tipo: string,
  lifecycle = 'ACTIVE'
): EnDosVistas {
  const comun = { id, severity: 'CRITICAL', title, file, line: 12, status: 'open', lifecycle }
  return {
    memoria: { ...comun, identity: `${file}|12|${tipo}`, simbolo: 'x', firstSeen: '2026', lastSeen: '2026', resolvedAt: null, mitigatedAt: null } as FindingMemory, // prettier-ignore
    fila: { ...comun, mitigatedNote: null, verificacionNote: null, lastSeen: '2026' } as Finding
  }
}

/** Los tres del banco del Terminal: uno de auth (degrada), uno neutro (edita) y
 *  uno ya mitigado (no se puede resolver). */
export const HALLAZGOS = [
  hallazgo('f-auth', 'src/auth/sesion.ts', 'La sesion no caduca nunca', 'autorizacion-ausente'),
  hallazgo('f-neutro', 'src/util/formato.ts', 'La fecha se formatea sin zona horaria', 'fecha-sin-zona'), // prettier-ignore
  hallazgo('f-mitigado', 'src/util/otro.ts', 'Ya arreglado', 'fecha-sin-zona', 'MITIGATED')
]
