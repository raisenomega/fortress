/**
 * SENTINEL OMEGA a traves del stack real (I): el Libro de la Vida append-only y
 * eterno, la verificacion contra el filesystem, y la evidencia leida del disco.
 * La puntuacion y el veto de push viven en omega-score-checks.cjs.
 */
const { createRecorder } = require('../lib/renderer-checks.cjs')
const { seedFinding, addExpr, makeRepo } = require('../lib/omega-seed.cjs')

module.exports = async function omegaChecks(window) {
  const { results, check, run } = createRecorder(window)

  // --- Parte A: registro eterno (proyecto sin hallazgos) ---
  const a = await run(addExpr('OmegaEterno', '/tmp/fortress-omega-eterno'))
  const idA = a.ok ? a.value.id : ''
  check('el libro arranca vacio', (await run(`window.api.omega.list('${idA}')`)).length === 0)
  await run(`window.api.omega.audit('${idA}')`)
  await run(`window.api.omega.audit('${idA}')`)
  check(
    'las auditorias se ACUMULAN (append-only)',
    (await run(`window.api.omega.list('${idA}')`)).length === 2
  )
  check(
    'el puente no expone borrar el libro',
    (await run('typeof window.api.omega.delete')) === 'undefined'
  )
  await run(`window.api.projects.remove('${idA}')`)
  check(
    'el Libro de la Vida SOBREVIVE al proyecto (eterno)',
    (await run(`window.api.omega.list('${idA}')`)).length === 2
  )

  // --- Parte B: verificacion contra el filesystem real ---
  const dir = makeRepo('fortress-omega-fs-')
  const b = await run(addExpr('OmegaFS', dir))
  const idB = b.ok ? b.value.id : ''
  seedFinding(idB, 'MEDIUM', 'src/real.ts', 2) // real -> ok
  seedFinding(idB, 'HIGH', 'src/fantasma.ts', 10) // no existe -> discrepancia
  seedFinding(idB, 'LOW', 'src/real.ts', 999) // fuera de rango -> discrepancia

  const audit = await run(`window.api.omega.audit('${idB}')`)
  check(
    'la verificacion cuenta 2 discrepancias de 3',
    audit.ok && audit.value.discrepancies === 2,
    JSON.stringify(audit)
  )

  const log = await run(`window.api.omega.list('${idB}')`)
  check('registra cada verificacion + el resumen (4 asientos)', log.length === 4)
  check(
    'el archivo fantasma es discrepancia',
    log.some((e) => e.verdict === 'discrepancia' && e.evidence.includes('fantasma'))
  )
  check(
    'la linea fuera de rango es discrepancia',
    log.some((e) => e.verdict === 'discrepancia' && e.evidence.includes('real.ts:999'))
  )
  check(
    'el hallazgo real NO es discrepancia',
    log.some((e) => e.verdict === 'ok' && e.evidence.includes('real.ts:2'))
  )

  // --- Parte E: evidencia leida del disco ---
  const snippet = await run(`window.api.omega.snippet('${idB}', 'src/real.ts', 2)`)
  check('la evidencia lee el codigo real del archivo', snippet.ok && snippet.value.found)
  check(
    'la evidencia trae la linea citada',
    snippet.ok && snippet.value.lines.some((l) => l.n === 2)
  )
  const fantasma = await run(`window.api.omega.snippet('${idB}', 'src/fantasma.ts', 1)`)
  check('un archivo fantasma no inventa evidencia', fantasma.ok && !fantasma.value.found)
  const pastEof = await run(`window.api.omega.snippet('${idB}', 'src/real.ts', 999)`)
  check('linea mas alla del EOF no inventa evidencia (found=false)', pastEof.ok && !pastEof.value.found)

  return results
}
