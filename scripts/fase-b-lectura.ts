import type { Database } from 'better-sqlite3'

export interface Fila {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly severity: string
  readonly identity: string
  readonly first_seen: string
}

export interface Clasificado {
  readonly id: string
  readonly tipo?: unknown
  readonly simbolo?: unknown
}

/**
 * Las filas VIVAS con identidad de antes de cp116. El alcance de la Fase B es
 * ese y solo ese: las extintas no las va a fusionar nadie, y a las vivas que
 * nadie ha vuelto a nombrar no les falta un tipo — les falta juicio, y eso es
 * del motor.
 */
export function leerVivas(db: Database, proyecto: string): readonly Fila[] {
  const p = db.prepare('SELECT id FROM projects WHERE name = ?').get(proyecto) as { id: string }
  return db
    .prepare(
      `SELECT id, file, line, title, severity, identity, first_seen FROM findings
       WHERE project_id = ? AND tipo = 'otro' AND lifecycle = 'ACTIVE' ORDER BY file, first_seen`
    )
    .all(p.id) as Fila[]
}

interface ConIdentidad {
  readonly id: string
  readonly identidad_nueva: string
}

export interface Grupo {
  readonly identidad: string
  readonly ids: readonly string[]
}

/** Las identidades nuevas que quedan REPETIDAS: esas son las que fusionaran. */
export function agrupar(filas: readonly ConIdentidad[]): readonly Grupo[] {
  const porIdentidad = new Map<string, string[]>()
  for (const f of filas) {
    const grupo = porIdentidad.get(f.identidad_nueva)
    if (grupo) grupo.push(f.id)
    else porIdentidad.set(f.identidad_nueva, [f.id])
  }
  return [...porIdentidad]
    .filter(([, ids]) => ids.length > 1)
    .map(([identidad, ids]) => ({ identidad, ids }))
}
