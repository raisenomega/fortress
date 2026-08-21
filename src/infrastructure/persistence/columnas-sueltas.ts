/**
 * Las columnas que fueron llegando de una en una, aparte de las migraciones que
 * hacen algo mas que anadir. La lista crece con cada pieza que necesita
 * recordar algo nuevo, y por eso vive sola: mezclarla con el orden de las
 * migraciones hacia que ese orden se leyera peor cada vez.
 */
/**
 * Columnas sueltas que fueron llegando. Cada default es el lado SEGURO: sin
 * confianza no se auto-ejecuta nada, sin loop no arranca nada, y una capacidad
 * nace propuesta porque nada asciende hasta que se apruebe el salto.
 */
export const SUELTAS: ReadonlyArray<readonly [string, string, string]> = [
  ['projects', 'trusted', 'ALTER TABLE projects ADD COLUMN trusted INTEGER NOT NULL DEFAULT 0'],
  ['projects', 'loop_enabled', 'ALTER TABLE projects ADD COLUMN loop_enabled INTEGER NOT NULL DEFAULT 0'], // prettier-ignore
  ['projects', 'general_quality', 'ALTER TABLE projects ADD COLUMN general_quality INTEGER'],
  ['projects', 'config_state', "ALTER TABLE projects ADD COLUMN config_state TEXT NOT NULL DEFAULT 'CONFIGURADO'"], // prettier-ignore
  ['capabilities', 'phase', "ALTER TABLE capabilities ADD COLUMN phase TEXT NOT NULL DEFAULT 'propuesta'"], // prettier-ignore
  // Nullable a proposito: una sesion anterior no tiene motivo que contar.
  ['loop_sessions', 'stopped_reason', 'ALTER TABLE loop_sessions ADD COLUMN stopped_reason TEXT'], // prettier-ignore
  ['loop_sessions', 'stopped_reason_detail', 'ALTER TABLE loop_sessions ADD COLUMN stopped_reason_detail TEXT'], // prettier-ignore
  ['loop_sessions', 'stopped_at', 'ALTER TABLE loop_sessions ADD COLUMN stopped_at TEXT'],
  ['scans', 'dossier_count', 'ALTER TABLE scans ADD COLUMN dossier_count INTEGER NOT NULL DEFAULT 0'], // prettier-ignore
  // Nullables: sin marca no hay nada que contar, y `resolved_at` no sirve para
  // esto — ahi vive la extincion, que afirma otra cosa.
  ['findings', 'mitigated_at', 'ALTER TABLE findings ADD COLUMN mitigated_at TEXT'], // prettier-ignore
  ['findings', 'mitigated_note', 'ALTER TABLE findings ADD COLUMN mitigated_note TEXT'] // prettier-ignore
]
