const { seedFinding, addExpr, makeRepo } = require('./omega-seed.cjs')

/**
 * SENTINEL OMEGA (II): verificacion contra el filesystem real y evidencia leida
 * del disco. Recibe run/check del recorder para acumular en los mismos results.
 */
module.exports = async function omegaFsChecks(run, check) {
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

  const snippet = await run(`window.api.omega.snippet('${idB}', 'src/real.ts', 2)`)
  check('la evidencia lee el codigo real del archivo', snippet.ok && snippet.value.found)
  check(
    'la evidencia trae la linea citada',
    snippet.ok && snippet.value.lines.some((l) => l.n === 2)
  )
  const fantasma = await run(`window.api.omega.snippet('${idB}', 'src/fantasma.ts', 1)`)
  check('un archivo fantasma no inventa evidencia', fantasma.ok && !fantasma.value.found)
  const pastEof = await run(`window.api.omega.snippet('${idB}', 'src/real.ts', 999)`)
  check(
    'linea mas alla del EOF no inventa evidencia (found=false)',
    pastEof.ok && !pastEof.value.found
  )
}
