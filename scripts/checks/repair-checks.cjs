/**
 * I1 — repair:propose / repair:list / repair:get por el stack real (renderer ->
 * preload -> IPC -> caso de uso -> SQLite). Ningun camino spawnea un agente.
 *
 * OJO CON LO QUE ESTO PRUEBA Y LO QUE NO. El proyecto de prueba vive en /tmp,
 * asi que desde ADR-107 el PERIMETRO lo niega antes de mirar la cola o el HEAD:
 * lo que se ejercita aqui es el stack entero y que el MOTIVO cruza el puente
 * intacto, no la seleccion. Mientras el motivo era `null`, estos checks decian
 * probar «sin candidato» y «sin ancla» y en realidad no llegaban ni a mirarlo
 * —pasaban por la razon equivocada—. Esos dos casos viven donde si se pueden
 * ejercitar: `plan-repair.test.ts`, con sus motivos `sin-candidato` y
 * `sin-head-de-git`. Los veredictos REAL/OBSOLETO, igual, con analista fake.
 */
const { insertFinding } = require('../lib/findings-seed.cjs')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

module.exports = async function repairChecks(window) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Motor I1', '/tmp/fortress-repair-i1', null))
  const id = added.ok ? added.value.id : ''
  check('el proyecto de prueba existe', added.ok, JSON.stringify(added))

  const vacia = await run(`window.api.repair.list('${id}')`)
  check('repair:list arranca vacio', Array.isArray(vacia) && vacia.length === 0)

  const sinHallazgos = await run(`window.api.repair.propose('${id}')`)
  check(
    'el perimetro niega un proyecto ajeno, y el motivo cruza el puente',
    sinHallazgos.ok === true &&
      sinHallazgos.value.ok === false &&
      sinHallazgos.value.reason === 'no-es-su-vehiculo',
    JSON.stringify(sinHallazgos)
  )

  // Con hallazgo, el perimetro sigue mandando: la guarda esta en el NACIMIENTO
  // y no despues de elegir, asi que tener candidato no cambia la respuesta.
  insertFinding(id, 'LOW', 'hallazgo de prueba para C1')
  const conHallazgo = await run(`window.api.repair.propose('${id}')`)
  check(
    'tener candidato no ablanda el perimetro: mismo motivo',
    conHallazgo.ok === true && conHallazgo.value.reason === 'no-es-su-vehiculo',
    JSON.stringify(conHallazgo)
  )

  const despues = await run(`window.api.repair.list('${id}')`)
  check('no queda propuesta colgada tras el rechazo', despues.length === 0)

  const desconocida = await run(`window.api.repair.get('no-existe')`)
  check('repair:get de un id desconocido es null', desconocida === null)

  return results
}
