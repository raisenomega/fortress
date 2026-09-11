/**
 * Columnas nuevas de `findings`. Se anaden sin CHECK porque SQLite no lo admite
 * en un ALTER; la validacion la hace el dominio al leer (`isFindingStatus`).
 * `severity` si conserva su CHECK: es la que decide si un push se bloquea.
 */
export const FINDING_COLUMNS: ReadonlyArray<readonly [string, string]> = [
  ['fingerprint', "ALTER TABLE findings ADD COLUMN fingerprint TEXT NOT NULL DEFAULT ''"],
  ['status', "ALTER TABLE findings ADD COLUMN status TEXT NOT NULL DEFAULT 'open'"],
  ['scan_id', 'ALTER TABLE findings ADD COLUMN scan_id TEXT']
]
