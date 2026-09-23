/**
 * Los ALIAS de clave de un hallazgo (ADR-101, palanca 2).
 *
 * Aparte de `schema.ts` por el tope de 75 lineas y porque lo que hay que
 * entender no es la tabla sino por que existe: el sync casa por clave exacta, y
 * una clave retirada por una fusion —o la de una sede que un agente juzgo el
 * mismo defecto— reaparecia como fila nueva en el escaneo siguiente, con la
 * historia perdida. Aqui queda dicho a que fila pertenece esa clave.
 */
export const ALIASES_SCHEMA = `
-- Una clave que YA no es la de ninguna fila viva pero que el escaner puede
-- volver a emitir, y la fila superviviente a la que pertenece. La escribe la
-- fusion (ADR-071) y el juicio del analista; el sync solo la consulta cuando
-- la clave exacta no casa. Un alias no caduca: si la superviviente murio por
-- juicio y su defecto vuelve, resucita como cualquier clave reencontrada.
CREATE TABLE IF NOT EXISTS finding_aliases (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  clave      TEXT NOT NULL,
  finding_id TEXT NOT NULL,
  origen     TEXT NOT NULL,
  at         TEXT NOT NULL,
  PRIMARY KEY (project_id, clave)
);
CREATE INDEX IF NOT EXISTS idx_aliases_finding ON finding_aliases (finding_id);
`
