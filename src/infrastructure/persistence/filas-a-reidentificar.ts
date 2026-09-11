import { findingIdentity } from '@domain/project/finding-identity'
import type { FilaConSeveridad } from '@domain/project/severidad-al-fundir'
import { isSeverity, type Severity } from '@domain/shared/severity'
import type { Db } from './database'

export interface FilaCruda {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly tipo: string
  readonly severity: string
  readonly first_seen: string
}

/**
 * Las filas VIVAS que se pueden reidentificar, y solo esas.
 *
 * Se saltan las de formato pre-ADR-067 —`severidad│fichero│titulo`, que el GLOB
 * reconoce porque ningun fichero se llama `CRITICAL`—. No es que no se puedan
 * recalcular: es que su `tipo` es el DEFAULT del ALTER, no una clasificacion, y
 * fundir por un valor por defecto colapsaria filas sobre algo que nadie juzgo.
 * Su reclasificacion es la deuda `identidad-inestable-FASE-B-backfill`, que
 * necesita un AGENTE. Esto es aritmetica, y no se mete donde hace falta juicio.
 */
const VIVAS = `SELECT id, file, line, tipo, severity, first_seen FROM findings
  WHERE lifecycle != 'EXTINCT' AND identity NOT GLOB '[A-Z]*|*'`

export const leerVivas = (db: Db): readonly FilaCruda[] => db.prepare(VIVAS).all() as FilaCruda[]

/** La clave nueva de una fila que ya esta en la base. `severity` cae a MEDIUM
 *  si alguien edito la base a mano: no oculta trabajo pendiente. */
export function aFilaConSeveridad(fila: FilaCruda): FilaConSeveridad {
  const finding = { file: fila.file, line: fila.line, tipo: fila.tipo } as Parameters<typeof findingIdentity>[0] // prettier-ignore
  return {
    id: fila.id,
    identidad: findingIdentity(finding),
    firstSeen: fila.first_seen,
    severity: (isSeverity(fila.severity) ? fila.severity : 'MEDIUM') as Severity
  }
}
