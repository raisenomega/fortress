/**
 * Self-diagnostics contra el `window.api` real. Se ejecuta despues de las otras
 * suites, asi que ya hay proyectos con rutas que no existen en disco: eso es
 * justo lo que debe detectar.
 */
module.exports = `(async () => {
  const results = []
  const check = (name, condition, detail) =>
    results.push({ name, pass: Boolean(condition), detail: detail ?? '' })
  const byId = (report, id) => report.checks.find((item) => item.id === id)

  const report = await window.api.health.run()

  check('devuelve un nivel global valido',
        ['ok', 'warning', 'error'].includes(report.level), report.level)
  check('sella la hora del diagnostico', typeof report.checkedAt === 'string')

  const sqlite = byId(report, 'sqlite')
  check('comprueba la integridad de SQLite', sqlite && sqlite.level === 'ok',
        JSON.stringify(sqlite))

  const apiKey = byId(report, 'api-key')
  check('sin API key lo marca como error', apiKey && apiKey.level === 'error',
        JSON.stringify(apiKey))

  const projects = byId(report, 'proyectos')
  check('detecta proyectos que no existen en disco',
        projects && projects.level === 'warning', JSON.stringify(projects))

  check('comprueba si git esta instalado', Boolean(byId(report, 'git')))
  check('comprueba si Claude Code esta instalado', Boolean(byId(report, 'claude-code')))

  const problems = report.checks.filter((item) => item.level !== 'ok')
  check('todo problema explica como arreglarlo',
        problems.length > 0 && problems.every((item) => typeof item.fix === 'string'),
        JSON.stringify(problems.map((item) => [item.id, item.fix])))

  check('el nivel global es el del peor check', report.level === 'error', report.level)

  const self = await window.api.projects.self()
  check('FORTRESS puede agregarse a si misma',
        self !== null && self.name.includes('FORTRESS'), JSON.stringify(self))
  check('se auto-detecta como proyecto Electron',
        self !== null && self.stack.length > 0, self ? self.stack : '')

  return results
})()`
