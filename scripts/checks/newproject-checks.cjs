const { mkdtempSync, existsSync } = require('fs')
const { execSync } = require('child_process')
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

  // Visor de documentacion IN-APP: lista los .md (incluido el interno) y los lee.
  const docs = await run(`window.api.docs.list('${id}')`)
  check(
    'el visor lista los .md del proyecto (incluido CONSTITUTION)',
    docs.includes('CONSTITUTION.md')
  )
  const doc = await run(`window.api.docs.read('${id}', 'CLAUDE.md')`)
  check('el visor lee el contenido de un .md', doc.ok && doc.value.length > 0)
  const evil = await run(`window.api.docs.read('${id}', '../../../etc/passwd')`)
  check('el visor rechaza traversal', !evil.ok)

  // Regla inmutable: la doc de gobierno NUNCA sube al repo; solo .gitignore/.env.example.
  const tracked = execSync('git ls-files', { cwd: dir, encoding: 'utf8' }).split('\n')
  check('el commit solo lleva .gitignore', tracked.includes('.gitignore'))
  check('CLAUDE.md NO esta trackeado (interno)', !tracked.includes('CLAUDE.md'))
  check('CONSTITUTION.md NO esta trackeado (interno)', !tracked.includes('CONSTITUTION.md'))
  check('ARCHITECTURE.md NO esta trackeado (interno)', !tracked.includes('ARCHITECTURE.md'))

  return results
}
