/**
 * SENTINEL OMEGA a traves del stack real (III): el veto de push respaldado por
 * evidencia. Salio de omega-score-checks.cjs el 18-sep por limite de lineas, y
 * la separacion se sostiene sola: alli se mide cuanto vale un agente, aqui si
 * un CRITICAL verificado en disco impide publicar.
 */
const { createRecorder } = require('../lib/renderer-checks.cjs')
const { markScanned } = require('../lib/findings-seed.cjs')
const { seedFinding, addExpr, makeRepo } = require('../lib/omega-seed.cjs')

module.exports = async function omegaPushChecks(window) {
  const { results, check, run } = createRecorder(window)

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
