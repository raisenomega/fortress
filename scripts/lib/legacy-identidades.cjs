/**
 * El trozo de base legacy que le toca a ADR-084: dos hallazgos en el MISMO
 * `fichero:linea` —lo que en el corpus real siempre resulto ser el mismo
 * defecto contado dos veces— y uno en otra linea del mismo fichero.
 *
 * Sin esto, la suite de migracion no ejercitaria el backfill de identidades:
 * una base sin duplicados lo atraviesa sin fundir nada, y no se sabria si corrio
 * o si se salto en silencio. Es la misma ceguera que dejo pasar un recambio de
 * `agent_runs` de un solo uso.
 */
const { withDb } = require('./findings-seed.cjs')

const AT = '2026-08-01T05:00:00.000Z'

const LEGACY_DUPES = `
INSERT INTO findings (id, project_id, severity, title, file, line, created_at) VALUES
  ('dup-vieja', 'viejo', 'LOW',    'el .env esta versionado en git',        'src/dup.js', 10, '${AT}'),
  ('dup-nueva', 'viejo', 'HIGH',   'fichero .env versionado con claves',    'src/dup.js', 10, '${AT}'),
  ('otra-linea','viejo', 'MEDIUM', 'otro defecto, otra linea del mismo js', 'src/dup.js', 88, '${AT}');
`

const writeLegacyIdentidades = (db) => db.exec(LEGACY_DUPES)

/** Que el backfill corrio de verdad al arrancar la app sobre la base vieja. */
function checkIdentidadesMigration(check) {
  withDb((db) => {
    const vivas = db.prepare("SELECT id, severity, identity FROM findings WHERE file = 'src/dup.js' AND lifecycle != 'EXTINCT' ORDER BY id").all() // prettier-ignore
    check('las dos del mismo sitio quedan en UNA', vivas.length === 2, JSON.stringify(vivas))
    check('y la clave nueva lleva la linea', vivas[0]?.identity === 'src/dup.js|10|otro', JSON.stringify(vivas)) // prettier-ignore
    // Fundir NO baja la gravedad: la superviviente es la mas vieja, con la
    // severidad MAXIMA del grupo (ADR-071, enmienda).
    check('la superviviente se queda la severidad maxima', vivas[0]?.severity === 'HIGH', JSON.stringify(vivas)) // prettier-ignore
    check('la de otra linea NO se fundio', vivas[1]?.identity === 'src/dup.js|88|otro', JSON.stringify(vivas)) // prettier-ignore

    const muerta = db.prepare("SELECT extinct_reason, identity, resolved_at FROM findings WHERE lifecycle = 'EXTINCT'").get() // prettier-ignore
    check('la absorbida dice de quien es', String(muerta?.extinct_reason).startsWith('fusionada-con-'), JSON.stringify(muerta)) // prettier-ignore
    check('con el centinela, para no resucitar', String(muerta?.identity).startsWith('fusionada:'), JSON.stringify(muerta)) // prettier-ignore
    check('y sin fecha de resolucion: no se resolvio', muerta?.resolved_at === null, JSON.stringify(muerta)) // prettier-ignore
  })
}

module.exports = { writeLegacyIdentidades, checkIdentidadesMigration }
