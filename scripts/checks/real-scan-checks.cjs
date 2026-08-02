/** Un escaneo real contra un proyecto con fallos reales. Tarda minutos. */
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')
const { withDb } = require('../lib/findings-seed.cjs')

module.exports = async function realScanChecks(window, dir) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Vulnerable', dir, 'git@example.com:acme/v.git'))
  if (!added.ok) {
    check('crea el proyecto vulnerable', false, JSON.stringify(added))
    return results
  }
  const id = added.value.id

  console.log('\nEscaneando de verdad. Esto tarda varios minutos...')
  const scan = await run(`window.api.scan.run('${id}')`)
  check('el escaneo termina bien', scan.ok, JSON.stringify(scan))
  if (!scan.ok) return results

  const { counts, score, durationMs } = scan.value
  console.log(`  score ${score} · ${JSON.stringify(counts)} · ${Math.round(durationMs / 1000)}s`)

  check('encuentra algo grave', counts.CRITICAL + counts.HIGH > 0, JSON.stringify(counts))
  check('el score deja de ser 100', score < 100, `score ${score}`)

  const findings = await run(`window.api.scan.findings('${id}')`)
  check('los hallazgos quedan guardados', findings.length > 0)
  check(
    'senala el archivo con la clave hardcodeada',
    findings.some((finding) => finding.file.includes('config.js')),
    JSON.stringify(findings.map((f) => `${f.severity} ${f.file}:${f.line} ${f.title}`))
  )

  const push = await run(`window.api.push.run('${id}')`)
  if (counts.CRITICAL > 0) {
    check(
      'el push queda bloqueado por el CRITICAL',
      !push.ok && /CRITICAL/.test(push.error),
      JSON.stringify(push)
    )
  } else {
    check('sin CRITICAL el push no se bloquea por FORTRESS', !/CRITICAL/.test(push.error ?? ''))
  }

  const timeline = await run(`window.api.activity.byProject('${id}', 50)`)
  check(
    'el escaneo deja entrada en el timeline',
    timeline.some((entry) => entry.kind === 'scan'),
    JSON.stringify(timeline.slice(0, 2))
  )
  check(
    'cada hallazgo deja su entrada',
    timeline.filter((entry) => entry.kind === 'finding').length === findings.length
  )

  const telemetria = withDb((db) =>
    db.prepare('SELECT agent_id, input_tokens, output_tokens, cost_usd FROM agent_runs').all()
  )
  check('registra la ejecucion del agente', telemetria.length === 1, JSON.stringify(telemetria))
  check(
    'registra tokens reales',
    (telemetria[0]?.output_tokens ?? 0) > 0,
    JSON.stringify(telemetria[0])
  )
  check('registra el coste que reporto el CLI', (telemetria[0]?.cost_usd ?? 0) > 0)
  check('lo atribuye al Security Reviewer', telemetria[0]?.agent_id === 'security-reviewer')

  console.log(
    `\n  ${findings.map((f) => `${f.severity} ${f.file}:${f.line} — ${f.title}`).join('\n  ')}`
  )
  return results
}
