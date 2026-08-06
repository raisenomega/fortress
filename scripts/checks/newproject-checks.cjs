const { mkdtempSync, existsSync } = require('fs')
const { tmpdir } = require('os')
const { join } = require('path')
const { createRecorder } = require('../lib/renderer-checks.cjs')

const DRAFTED = [
  'CONSTITUTION.md',
  'DDD-RULES.md',
  'SECURITY-BASELINE.md',
  'ARCHITECTURE.md',
  'CLAUDE.md',
  'AGENTS.md',
  'PROJECT-STATE.md'
]

/** Crear proyecto desde cero: alta vacia (PENDIENTE + git) y la escritura del
 *  marco al ejecutar (10 archivos + commit + CONFIGURADO). La entrevista con el
 *  agente real queda fuera; aqui se prueban las costuras deterministas. */
module.exports = async function newProjectChecks(window) {
  const { results, check, run } = createRecorder(window)
  const dir = mkdtempSync(join(tmpdir(), 'fortress-nuevo-'))

  const reg = await run(
    `window.api.newProject.register({ name: 'Vacio', path: '${dir}', stack: '' })`
  )
  const id = reg.ok ? reg.value.id : ''
  check('registra el proyecto vacio', reg.ok, JSON.stringify(reg))
  check(
    'nace PENDIENTE_CONFIGURACION',
    reg.ok && reg.value.configState === 'PENDIENTE_CONFIGURACION'
  )
  check('git init dejo un repo', existsSync(join(dir, '.git')))

  const drafts = JSON.stringify(Object.fromEntries(DRAFTED.map((doc) => [doc, `# ${doc}\ncuerpo`])))
  const exec = await run(`window.api.newProject.execute('${id}', ${drafts})`)
  check('ejecuta y escribe el marco', exec.ok, JSON.stringify(exec))
  check('escribio CLAUDE.md (commiteable)', existsSync(join(dir, 'CLAUDE.md')))
  check('escribio CONSTITUTION.md (interno)', existsSync(join(dir, 'CONSTITUTION.md')))
  check('genero .gitignore', existsSync(join(dir, '.gitignore')))
  check('genero COGNITION-LOG.md (gen 0)', existsSync(join(dir, 'COGNITION-LOG.md')))

  const list = await run('window.api.projects.list()')
  const proj = list.find((p) => p.id === id)
  check('el proyecto queda CONFIGURADO', Boolean(proj) && proj.configState === 'CONFIGURADO')

  const bad = await run(
    `window.api.newProject.execute('${id}', ${JSON.stringify({ 'CLAUDE.md': 'x' })})`
  )
  check('con documentos faltantes, rechaza', !bad.ok)

  return results
}
