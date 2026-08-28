/**
 * scan:mitigate por el stack real — el canal que se quedo sin integracion
 * cuando `dismissal-checks` cubrio solo su hermano. Prueba el CANAL, no el
 * boton: que la llave inglesa abra su dialogo se comprueba sobre la app real,
 * y es justo lo que nadie hizo mientras `window.prompt` la tuvo muerta.
 */
const { insertFinding, markScanned, withDb } = require('../lib/findings-seed.cjs')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

const PATH = '/tmp/fortress-mitigados'
const NOTA = 'cubierto en otro modulo — sha 0e8567f'

const fila = (id) =>
  withDb(
    (db) =>
    db.prepare('SELECT lifecycle, status, mitigated_at, mitigated_note FROM findings WHERE id = ?').get(id) // prettier-ignore
  )

module.exports = async function mitigateChecks(window) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Mitigados', PATH, null))
  const id = added.ok ? added.value.id : ''
  insertFinding(id, 'MEDIUM', 'guarda que se movio a otro modulo')
  markScanned(id, 70)

  const antes = await run(`window.api.scan.findings('${id}')`)
  const hallazgo = antes[0].id
  check('nace ACTIVE y abierto', antes[0].lifecycle === 'ACTIVE', JSON.stringify(antes[0].lifecycle)) // prettier-ignore

  const marcado = await run(`window.api.scan.mitigate('${hallazgo}', ${JSON.stringify(NOTA)})`)
  check('el canal marca como arreglado', marcado.ok, JSON.stringify(marcado))

  const tras = fila(hallazgo)
  check('queda MITIGATED con fecha y con LA NOTA', tras.lifecycle === 'MITIGATED' && tras.mitigated_at !== null && tras.mitigated_note === NOTA, JSON.stringify(tras)) // prettier-ignore
  check('NO lo descarta: status sigue abierto', tras.status === 'open', tras.status)

  const visible = await run(`window.api.scan.findings('${id}')`)
  check('sigue a la vista en el tablero, con su nota', visible.length === 1 && visible[0].mitigatedNote === NOTA, JSON.stringify(visible[0] && visible[0].mitigatedNote)) // prettier-ignore

  // vivo() = ACTIVE && open, asi que MITIGATED lo saca de la cola por las dos
  // vias: la seleccion automatica y la dirigida. Aqui se ve por la dirigida.
  const dirigido = await run(`window.api.repair.propose('${id}', '${hallazgo}')`)
  check('el motor ya no lo puede elegir ni dirigido', dirigido.ok && dirigido.value === null, JSON.stringify(dirigido)) // prettier-ignore

  const deshecho = await run(`window.api.scan.unmitigate('${hallazgo}')`)
  check('deshacer lo devuelve a ACTIVE sin nota', deshecho.ok && fila(hallazgo).lifecycle === 'ACTIVE' && fila(hallazgo).mitigated_note === null, JSON.stringify(fila(hallazgo))) // prettier-ignore

  const fantasma = await run(`window.api.scan.mitigate('no-existe', 'x')`)
  check('mitigar algo inexistente falla con motivo', !fantasma.ok, JSON.stringify(fantasma))

  return results
}
