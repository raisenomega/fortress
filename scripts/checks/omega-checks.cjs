/**
 * El Libro de la Vida de OMEGA a traves del stack real (renderer -> IPC -> SQLite).
 * Prueba lo no negociable: se anexa, nunca se pisa, y SOBREVIVE a quitar el
 * proyecto. La ley "el registro es eterno" se verifica, no se promete.
 */
module.exports = `(async () => {
  const results = []
  const check = (name, condition, detail) =>
    results.push({ name, pass: Boolean(condition), detail: detail ?? '' })

  const PATH = '/tmp/fortress-omega-proyecto'
  const added = await window.api.projects.add({ name: 'Omega', path: PATH, stack: 'node',
    gitRemote: null, gitBranch: 'main', hasClaude: true })
  const id = added.ok ? added.value.id : ''

  check('el libro arranca vacio', (await window.api.omega.list(id)).length === 0)

  const audit = await window.api.omega.audit(id)
  check('la auditoria deja un asiento', audit.ok, JSON.stringify(audit))

  const log1 = await window.api.omega.list(id)
  check('el asiento aparece en el libro', log1.length === 1, JSON.stringify(log1))
  check('el asiento lo firma OMEGA', log1[0] && log1[0].agentId === 'sentinel-omega')
  check('sin escaneo previo, veredicto ok', log1[0] && log1[0].verdict === 'ok',
    JSON.stringify(log1[0]))

  await window.api.omega.audit(id)
  check('las auditorias se ACUMULAN (append-only)',
    (await window.api.omega.list(id)).length === 2)

  // No existe api para borrar un asiento: el operador no puede, a proposito.
  check('el puente no expone forma de borrar el libro',
    typeof (window.api.omega.delete) === 'undefined' &&
    typeof (window.api.omega.clear) === 'undefined')

  await window.api.projects.remove(id)
  const vivos = await window.api.projects.list()
  check('el proyecto se fue', vivos.every((p) => p.id !== id))
  const eterno = await window.api.omega.list(id)
  check('el Libro de la Vida SOBREVIVE al proyecto (eterno)', eterno.length === 2,
    JSON.stringify(eterno))

  return results
})()`
