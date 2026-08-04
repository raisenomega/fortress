/**
 * SENTINEL OMEGA a traves del stack real. Prueba lo no negociable:
 *  - Libro de la Vida: se anexa, nunca se pisa, SOBREVIVE a quitar el proyecto.
 *  - Motor de verificacion: contrasta cada hallazgo contra el filesystem real.
 *    Archivo real -> ok; archivo fantasma o linea fuera de rango -> discrepancia.
 */
const { mkdtempSync, mkdirSync, writeFileSync } = require('fs')
const { join } = require('path')
const { tmpdir } = require('os')
const { withDb } = require('../lib/findings-seed.cjs')
const { createRecorder } = require('../lib/renderer-checks.cjs')

let seq = 0
function seedFinding(projectId, severity, file, line) {
  seq += 1
  return withDb((db) =>
    db
      .prepare(
        `INSERT INTO findings (id, project_id, severity, title, file, line, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(`omega-${seq}`, projectId, severity, `hallazgo ${seq}`, file, line, new Date().toISOString())
  )
}

const add = (name, path) =>
  `window.api.projects.add({ name: '${name}', path: '${path}', stack: 'node',
     gitRemote: null, gitBranch: 'main', hasClaude: true })`

module.exports = async function omegaChecks(window) {
  const { results, check, run } = createRecorder(window)

  // --- Parte A: registro eterno (proyecto sin hallazgos) ---
  const a = await run(add('OmegaEterno', '/tmp/fortress-omega-eterno'))
  const idA = a.ok ? a.value.id : ''
  check('el libro arranca vacio', (await run(`window.api.omega.list('${idA}')`)).length === 0)
  await run(`window.api.omega.audit('${idA}')`)
  await run(`window.api.omega.audit('${idA}')`)
  check('las auditorias se ACUMULAN (append-only)',
    (await run(`window.api.omega.list('${idA}')`)).length === 2)
  check('el puente no expone borrar el libro',
    (await run('typeof window.api.omega.delete')) === 'undefined')
  await run(`window.api.projects.remove('${idA}')`)
  check('el Libro de la Vida SOBREVIVE al proyecto (eterno)',
    (await run(`window.api.omega.list('${idA}')`)).length === 2)

  // --- Parte B: verificacion contra el filesystem real ---
  const dir = mkdtempSync(join(tmpdir(), 'fortress-omega-fs-'))
  mkdirSync(join(dir, 'src'), { recursive: true })
  writeFileSync(join(dir, 'src', 'real.ts'), 'a\nb\nc\n')

  const b = await run(add('OmegaFS', dir))
  const idB = b.ok ? b.value.id : ''
  seedFinding(idB, 'MEDIUM', 'src/real.ts', 2) // real -> ok
  seedFinding(idB, 'HIGH', 'src/fantasma.ts', 10) // no existe -> discrepancia
  seedFinding(idB, 'LOW', 'src/real.ts', 999) // fuera de rango -> discrepancia

  const audit = await run(`window.api.omega.audit('${idB}')`)
  check('la verificacion cuenta 2 discrepancias de 3',
    audit.ok && audit.value.discrepancies === 2, JSON.stringify(audit))

  const log = await run(`window.api.omega.list('${idB}')`)
  check('registra cada verificacion + el resumen (4 asientos)', log.length === 4,
    JSON.stringify(log.map((e) => e.verdict)))
  check('el archivo fantasma es discrepancia',
    log.some((e) => e.verdict === 'discrepancia' && e.evidence.includes('fantasma')))
  check('la linea fuera de rango es discrepancia',
    log.some((e) => e.verdict === 'discrepancia' && e.evidence.includes('real.ts:999')))
  check('el hallazgo real NO es discrepancia',
    log.some((e) => e.verdict === 'ok' && e.evidence.includes('real.ts:2')))

  // --- Parte C: puntuacion con datos reales ---
  const score = await run(`window.api.omega.score('${idB}')`)
  check('la puntuacion sale con datos reales', score.ok, JSON.stringify(score))
  check('veracidad = 33 (1 de 3 hallazgos cuadra)',
    score.ok && score.value.veracity === 33, JSON.stringify(score))
  check('sin runs del agente, cumplimiento es null (sin datos, no cero)',
    score.ok && score.value.compliance === null)
  check('overall bajo -> banda no-usar',
    score.ok && score.value.band === 'no-usar', JSON.stringify(score))

  return results
}
