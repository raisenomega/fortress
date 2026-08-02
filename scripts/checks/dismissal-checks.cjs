/** Historico de escaneos y descarte de falsos positivos. */
const { insertFinding, markScanned, recordScan } = require('../lib/findings-seed.cjs')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

const PATH = '/tmp/fortress-descartes'

module.exports = async function dismissalChecks(window) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Descartes', PATH, 'git@example.com:acme/d.git'))
  const id = added.ok ? added.value.id : ''
  insertFinding(id, 'CRITICAL', 'API key hardcodeada')
  markScanned(id, 64)

  recordScan(id, 64, 1)
  recordScan(id, 92, 0)
  const historial = await run(`window.api.scan.history('${id}', 10)`)
  check('guarda el historico de escaneos', historial.length === 2, JSON.stringify(historial))
  check(
    'el historico viene del mas reciente al mas antiguo',
    historial[0].score === 92 && historial[1].score === 64,
    JSON.stringify(historial.map((scan) => scan.score))
  )

  const hallazgos = await run(`window.api.scan.findings('${id}')`)
  const descartado = await run(`window.api.scan.dismiss('${hallazgos[0].id}')`)
  check('descarta un hallazgo', descartado.ok, JSON.stringify(descartado))

  const tras = await run('window.api.scan.counts()')
  check(
    'un hallazgo descartado deja de contar',
    (tras[id]?.CRITICAL ?? 0) === 0,
    JSON.stringify(tras[id])
  )

  const marcado = await run(`window.api.scan.findings('${id}')`)
  check(
    'sigue a la vista, marcado como falso positivo',
    marcado[0].status === 'false_positive',
    JSON.stringify(marcado[0])
  )

  await run(`window.api.scan.reopen('${hallazgos[0].id}')`)
  const reabierto = await run('window.api.scan.counts()')
  check('reabrirlo lo vuelve a contar', reabierto[id]?.CRITICAL === 1)

  const fantasma = await run(`window.api.scan.dismiss('no-existe')`)
  check('descartar algo inexistente falla con motivo', !fantasma.ok, JSON.stringify(fantasma))

  return results
}
