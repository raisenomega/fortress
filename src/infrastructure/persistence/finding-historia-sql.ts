/**
 * La HISTORIA del proyecto: solo lo cerrado, con lo que hace falta para decir de
 * que murio cada uno (ADR-087).
 *
 * Consulta propia y no `SELECT_MEMORY` ampliada. Aquella es el expediente que
 * usa el MOTOR —diez consumidores que no pintan nada— y anadirle el motivo y el
 * quien los cargaria con dos columnas que ninguno mira. Ademas ordena por
 * URGENCIA, que en una historia no significa nada: aqui manda la fecha.
 *
 * `resolved_at IS NULL` primero en el ORDER BY empuja al final las veinte de
 * fusion, que no tienen fecha de cierre porque no se resolvieron. Sin eso SQLite
 * las pondria arriba —NULL ordena bajo— y la historia abriria con lo que menos
 * se parece a una resolucion.
 */
export const SELECT_HISTORIA = `SELECT id, severity, title, file, line, first_seen,
  resolved_at, extinct_reason, extinguido_por FROM findings
  WHERE project_id = ? AND lifecycle = 'EXTINCT'
  ORDER BY resolved_at IS NULL, resolved_at DESC, first_seen DESC`
