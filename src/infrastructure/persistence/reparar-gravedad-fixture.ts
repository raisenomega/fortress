import { PROJECT, type Bench } from './finding-fixture'

/** El escenario REAL del 24-ago: una superviviente MEDIUM que absorbio un HIGH,
 *  y una LOW —mitigada por el operador— que absorbio un MEDIUM. */
// prettier-ignore
const FILAS: readonly [string, string, string, string | null, string][] = [
  ['correa', 'MEDIUM', 'ACTIVE', null, '2026-07-01T00:00:00Z'],
  ['correa-abs', 'HIGH', 'EXTINCT', 'fusionada-con-correa', '2026-08-18T00:00:00Z'],
  ['argv', 'LOW', 'MITIGATED', null, '2026-07-05T00:00:00Z'],
  ['argv-abs', 'MEDIUM', 'EXTINCT', 'fusionada-con-argv', '2026-08-17T00:00:00Z']
]

export function dosVictimas(bench: Bench): void {
  // prettier-ignore
  const insertar = bench.db.prepare(
    `INSERT INTO findings (id, project_id, severity, title, file, line, created_at,
      identity, tipo, simbolo, lifecycle, first_seen, last_seen, extinct_reason)
     VALUES (?, ?, ?, ?, 'f.ts', 1, ?, ?, 'otro', '', ?, ?, ?, ?)`
  )
  for (const [id, sev, ciclo, motivo, desde] of FILAS) {
    insertar.run(id, PROJECT, sev, `titulo ${id}`, desde, `id-${id}`, ciclo, desde, desde, motivo)
  }
}

export const filaDe = (bench: Bench, id: string): Record<string, unknown> =>
  bench.db.prepare('SELECT * FROM findings WHERE id = ?').get(id) as Record<string, unknown>
