/**
 * Lo que la migracion cambia por DEBAJO de la API: el recambio del motor, el de
 * `agent_runs` y el backfill de identidades de ADR-084. Se afirman por SQL
 * porque lo que cambia es el esquema o la clave, y ninguno de los dos asoma por
 * el bridge; van juntos porque los tres responden a la misma pregunta —¿corrio
 * de verdad al abrir la base, o se salto en silencio?
 */
const { checkRepairMigration } = require('./legacy-repair.cjs')
const { checkRunsMigration } = require('./legacy-runs.cjs')
const { checkIdentidadesMigration } = require('./legacy-identidades.cjs')

const checkMigracionesPorSql = (check) =>
  [checkRepairMigration, checkRunsMigration, checkIdentidadesMigration].forEach((c) => c(check))

module.exports = { checkMigracionesPorSql }
