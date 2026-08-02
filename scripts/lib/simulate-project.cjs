/** Siembra el resultado de un escaneo para un solo proyecto del preview. */
const { RESULTS } = require('./scan-fixture.cjs')

const SCANNED_AT = '2026-08-02T05:00:00.000Z'

function seedProject(statements, projectId, index) {
  const result = RESULTS[index % RESULTS.length]
  statements.updateScan.run(result.score, SCANNED_AT, projectId)

  result.findings.forEach(([severity, title, file, line], n) =>
    statements.insert.run(`${projectId}-${n}`, projectId, severity, title, file, line, SCANNED_AT)
  )
  // Con la hora actual a proposito: el indicador de la barra cuenta solo
  // lo consumido en la sesion en curso, y SCANNED_AT es de una anterior.
  // Varios escaneos en la ultima semana: sin al menos dos no hay tendencia.
  const hoy = Date.now()
  ;[4, 2, 0].forEach((diasAtras, paso) => {
    const cuando = new Date(hoy - diasAtras * 86400000).toISOString()
    const score = Math.max(0, result.score - (2 - paso) * 12)
    statements.insertScan.run(
      `s-${projectId}-${paso}`,
      projectId,
      score,
      result.findings.length,
      result.findings.filter(([sev]) => sev === 'CRITICAL').length,
      cuando
    )
  })

  statements.insertRun.run(`run-${projectId}`, projectId, 0.0664025, new Date().toISOString())

  statements.insertActivity.run(
    `act-${projectId}`,
    projectId,
    'scan',
    `Escaneo de seguridad: ${result.findings.length} hallazgos`,
    null,
    '',
    null,
    SCANNED_AT
  )
  result.findings.forEach(([severity, title, file, line], n) =>
    statements.insertActivity.run(
      `act-${projectId}-${n}`,
      projectId,
      'finding',
      title,
      severity,
      file,
      line,
      SCANNED_AT
    )
  )
}

module.exports = { seedProject }
