/** Semillas compartidas por los checks de OMEGA: hallazgos y repos de prueba. */
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

/** Crea un repo temporal con src/real.ts. Devuelve su ruta. */
function makeRepo(prefix, body = 'a\nb\nc\n') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  mkdirSync(join(dir, 'src'), { recursive: true })
  writeFileSync(join(dir, 'src', 'real.ts'), body)
  return dir
}

module.exports = { seedFinding, addExpr, makeRepo }
