/**
 * SENTINEL OMEGA a traves del stack real (II): la puntuacion con datos reales,
 * la salud macro de los agentes, y el veto de push respaldado por evidencia.
 * El Libro y la verificacion contra disco viven en omega-checks.cjs.
 */
const { createRecorder } = require('../lib/renderer-checks.cjs')
const { markScanned } = require('../lib/findings-seed.cjs')
const { seedFinding, addExpr, makeRepo } = require('../lib/omega-seed.cjs')

module.exports = async function omegaScoreChecks(window) {
  const { results, check, run } = createRecorder(window)

  // --- Puntuacion + salud de agentes: 1 de 3 hallazgos cuadra con el disco ---
  const dir = makeRepo('fortress-omega-score-')
  const s = await run(addExpr('OmegaScore', dir))
  const idS = s.ok ? s.value.id : ''
  seedFinding(idS, 'MEDIUM', 'src/real.ts', 2) // real -> ok
  seedFinding(idS, 'HIGH', 'src/fantasma.ts', 10) // discrepancia
  seedFinding(idS, 'LOW', 'src/real.ts', 999) // discrepancia
  await run(`window.api.omega.audit('${idS}')`)

  const score = await run(`window.api.omega.score('${idS}')`)
  check('la puntuacion sale con datos reales', score.ok, JSON.stringify(score))
  check(
    'veracidad = 33 (1 de 3 hallazgos cuadra)',
    score.ok && score.value.veracity === 33,
    JSON.stringify(score)
  )
  check(
    'sin runs del agente, cumplimiento es null (sin datos, no cero)',
    score.ok && score.value.compliance === null
  )
  check('overall bajo -> banda no-usar', score.ok && score.value.band === 'no-usar')

  const agents = await run(`window.api.omega.agents('${idS}')`)
  check('la salud macro cubre los 13 agentes del catalogo', agents.length === 13)
  check(
    'incluye a sentinel-omega en la tabla',
    agents.some((a) => a.agentId === 'sentinel-omega')
  )
  // ADR-088, Enmienda 2: el productor del Terminal es visible para OMEGA.
  check(
    'incluye al productor del Terminal',
    agents.some((a) => a.agentId === 'productor')
  )
  check(
    'sin runs, el cumplimiento del agente es null (no cero)',
    agents.every((a) => a.compliance === null)
  )

  // --- Veto de push respaldado por evidencia ---
  const dirD = makeRepo('fortress-omega-push-', 'x\ny\n')
  const d = await run(addExpr('OmegaPush', dirD, 'git@example.com:acme/omega.git'))
  const idD = d.ok ? d.value.id : ''
  seedFinding(idD, 'CRITICAL', 'src/real.ts', 1)
  markScanned(idD, 40)

  const push = await run(`window.api.push.run('${idD}')`)
  check('el push queda bloqueado por CRITICAL', !push.ok, JSON.stringify(push))
  const vetoLog = await run(`window.api.omega.list('${idD}')`)
  check(
    'OMEGA registra un VETO con evidencia del CRITICAL',
    vetoLog.some((e) => e.verdict === 'veto' && e.evidence.includes('src/real.ts:1'))
  )
  check(
    'el veto dice que el CRITICAL esta verificado en disco',
    vetoLog.some((e) => e.verdict === 'veto' && e.summary.includes('1 verificados'))
  )

  return results
}
