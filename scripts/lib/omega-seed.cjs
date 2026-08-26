/** Semillas compartidas por los checks de OMEGA: hallazgos y repos de prueba. */
const { execFileSync } = require('child_process')
const { mkdtempSync, mkdirSync, writeFileSync } = require('fs')
const { join } = require('path')
const { tmpdir } = require('os')
const { withDb } = require('./findings-seed.cjs')

let seq = 0

/** Inserta un hallazgo directo en la BD (id unico entre todos los checks). */
function seedFinding(projectId, severity, file, line) {
  seq += 1
  return withDb((db) =>
    db
      .prepare(
        `INSERT INTO findings (id, project_id, severity, title, file, line, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        `omega-${seq}`,
        projectId,
        severity,
        `hallazgo ${seq}`,
        file,
        line,
        new Date().toISOString()
      )
  )
}

/** Expresion para el bridge que da de alta un proyecto con esa ruta. */
function addExpr(name, path, gitRemote = null) {
  return `window.api.projects.add({ name: '${name}', path: '${path}', stack: 'node',
     gitRemote: ${gitRemote ? `'${gitRemote}'` : 'null'}, gitBranch: 'main', hasClaude: true })`
}

/**
 * Repo git REAL con src/real.ts dentro. Devuelve su ruta.
 *
 * El `git init` no es adorno: un proyecto de FORTRESS es la raiz de su propio
 * repositorio, y hay guardas que se lo preguntan a git —`push:run` rechaza una
 * carpeta que no lo sea, porque empujarla publicaria el repo padre—. Mientras
 * esto devolvio una carpeta suelta, los checks pasaban por caminos que en
 * produccion no existen, y el dia que una guarda pregunto se cayeron cinco de
 * golpe. Un harness que no se parece a produccion prueba otra cosa.
 */
function makeRepo(prefix, body = 'a\nb\nc\n') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  mkdirSync(join(dir, 'src'), { recursive: true })
  writeFileSync(join(dir, 'src', 'real.ts'), body)

  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' })
  git('init', '--quiet')
  git('config', 'user.email', 'test@fortress.local')
  git('config', 'user.name', 'FORTRESS Test')
  git('add', '-A')
  git('commit', '--quiet', '-m', 'init')
  return dir
}

module.exports = { seedFinding, addExpr, makeRepo }
