/**
 * I1 — repair:propose / repair:list / repair:get por el stack real (renderer ->
 * preload -> IPC -> caso de uso -> SQLite). Ningun camino spawnea un agente:
 * el analista solo corre cuando hay candidato Y repo git, y aqui se corta
 * antes a proposito. Los veredictos REAL/OBSOLETO se prueban a nivel unitario
 * con analista fake (plan-repair.test.ts).
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
    'sin hallazgos ACTIVE, propose devuelve null (C1 no elige nada)',
    sinHallazgos.ok === true && sinHallazgos.value === null,
    JSON.stringify(sinHallazgos)
  )

  // Con hallazgo pero SIN repo git: C1 SI elige, el ancla de HEAD falla y no
  // se inserta nada. Ejercita la seleccion real sin llegar al analista.
  insertFinding(id, 'LOW', 'hallazgo de prueba para C1')
  const sinGit = await run(`window.api.repair.propose('${id}')`)
  check(
    'con hallazgo pero sin repo git, propose devuelve null (sin ancla)',
    sinGit.ok === true && sinGit.value === null,
    JSON.stringify(sinGit)
  )

  const despues = await run(`window.api.repair.list('${id}')`)
  check('no queda propuesta colgada tras el rechazo', despues.length === 0)

  const desconocida = await run(`window.api.repair.get('no-existe')`)
  check('repair:get de un id desconocido es null', desconocida === null)

  return results
}
