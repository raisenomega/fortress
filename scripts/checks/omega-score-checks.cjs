/**
 * SENTINEL OMEGA a traves del stack real (II): la puntuacion con datos reales
 * y la salud macro de los agentes.
 *
 * El VETO DE PUSH vivia aqui y salio el 18-sep, al entrar el critico en la
 * salud macro: el fichero paso de 75 lineas. La costura la marcaba el propio
 * codigo —dos bloques con su cabecera— y son dos preguntas distintas: cuanto
 * vale un agente, y si un CRITICAL bloquea el push. El Libro y la verificacion
 * contra disco siguen en omega-checks.cjs.
 */
const { createRecorder } = require('../lib/renderer-checks.cjs')
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
  check('la salud macro cubre los 14 agentes del catalogo', agents.length === 14)
  check(
    'incluye a sentinel-omega en la tabla',
    agents.some((a) => a.agentId === 'sentinel-omega')
  )
  // ADR-088, Enmienda 2: el productor del Terminal es visible para OMEGA.
  check(
    'incluye al productor del Terminal',
    agents.some((a) => a.agentId === 'productor')
  )
  // ADR-096, Fase B: quien critica tambien se audita. Un critico que aprueba
  // todo tiene que notarse en su salud, igual que un productor que rompe todo.
  check(
    'incluye al critico del debate',
    agents.some((a) => a.agentId === 'critico')
  )
  check(
    'sin runs, el cumplimiento del agente es null (no cero)',
    agents.every((a) => a.compliance === null)
  )

  return results
}
