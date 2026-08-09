/**
 * I1.5-a — reconciliacion del grafo por el stack real. Los proyectos de /tmp no
 * son repos git, asi que toda decision es SKIPPED: se ejercita canal, caso de
 * uso y estado persistido SIN disparar un indexado real (el ciclo completo
 * RUNNING->IDLE vive en los tests unitarios con runner fake).
 */
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

module.exports = async function graphReindexChecks(window) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Grafo I15a', '/tmp/fortress-grafo-i15a', null))
  const id = added.ok ? added.value.id : ''

  const estado = await run(`window.api.graph.state('${id}')`)
  check(
    'graph:state arranca IDLE, sin indexar y sin HEAD (no es repo git)',
    estado !== null && estado.status === 'IDLE' && estado.indexedSha === null &&
      estado.currentSha === null,
    JSON.stringify(estado)
  ) // prettier-ignore

  const decision = await run(`window.api.graph.reindex('${id}')`)
  check('graph:reindex sobre proyecto sin git decide SKIPPED', decision === 'SKIPPED')

  const foco = await run(`window.api.graph.focus('${id}')`)
  check('projects:focus responde sin bloquear', foco === null)

  const fantasma = await run(`window.api.graph.state('nope')`)
  check('graph:state de un proyecto desconocido es null', fantasma === null)

  return results
}
