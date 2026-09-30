/**
 * Lo que sobrevive del gate del loop, por el stack real (renderer -> preload ->
 * IPC -> caso de uso).
 *
 * ADR-107 retiro el loop, y con el casi toda esta suite: las paredes de topes y
 * de confianza guardaban un encendido que ya no existe. Se conservan las DOS
 * comprobaciones que nunca fueron del loop:
 *
 * 1. Revocar la confianza APAGA el flag. La columna vive con su historia, y
 *    dejarla encendida en un proyecto en el que ya no se confia seria un estado
 *    que miente. Ahora no hay proceso que detener, solo el flag que apagar.
 * 2. `chat:stop` cumple su contrato `Promise<number>` aunque no corra nada.
 *
 * La garantia de «el repo propio no se integra solo» NO estaba aqui: vive en
 * `integracion-sin-firma.ts` y la cubren sus tests de dominio.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

const FLAG = 'SELECT loop_enabled FROM projects WHERE id = ?'

function withDb(work) {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))
  try {
    return work(db)
  } finally { db.close() } // prettier-ignore
}

module.exports = async function confianzaChecks(window) {
  const { results, check, run } = createRecorder(window)

  const ajeno = await run(addProject('Ajeno', '/tmp/fortress-confianza-ajeno', null))
  await run(`window.api.projects.setTrusted('${ajeno.value.id}', true)`)

  // Se fuerza el flag en la base, como si hubiera quedado encendido de antes, y
  // se revoca por el canal real: la revocacion tiene que apagarlo.
  withDb((db) =>
    db.prepare('UPDATE projects SET loop_enabled = 1 WHERE id = ?').run(ajeno.value.id)
  )
  await run(`window.api.projects.setTrusted('${ajeno.value.id}', false)`)
  const trasRevocar = withDb((db) => db.prepare(FLAG).get(ajeno.value.id)) // prettier-ignore
  check('revocar la confianza apaga el flag del loop', trasRevocar.loop_enabled === 0)

  // Detener es total e idempotente: responde el conteo aunque no corra nada.
  const detenido = await run(`window.api.chat.stop('${ajeno.value.id}')`)
  check('chat:stop cumple su contrato Promise<number>', detenido === 0)

  return results
}
