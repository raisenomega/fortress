import type { Violation } from './integrity'

export const CONTAMINATED_MSG =
  'Proyecto CONTAMINADO: la auditoria detecto que un archivo cambio y las capas de ' +
  'restauracion no lo dejaron byte-identico. FORTRESS bloqueo el proyecto y exige ' +
  'revision humana antes de volver a tocarlo.'

export const CONTAMINATED_BLOCK =
  'Proyecto marcado como CONTAMINADO por una auditoria anterior. Bloqueado hasta ' +
  'revision humana: revisa el detalle forense y desbloquealo a mano.'

const short = (hash: string | null): string => (hash === null ? 'ausente' : hash.slice(0, 12))

/** Reporte forense de las violaciones: archivo + hash antes/despues (Capa 4). */
export function forensic(violations: readonly Violation[]): string {
  return violations
    .slice(0, 20)
    .map((v) => `${v.kind} ${v.path} (${short(v.before)} -> ${short(v.after)})`)
    .join('; ')
}
