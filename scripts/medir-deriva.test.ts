import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import Database from 'better-sqlite3'

// Uso: node --test scripts/medir-deriva.test.ts
// Base sintetica con un proyecto NO confiable y un `claude` falso que deja
// testigo: si el gate de confianza faltara, la parada lanzaria Bash pre-aprobado
// con cwd en el arbol del proyecto (la doctrina de gate-guards.ts).
test('sin confianza falla cerrado y no lanza la parada', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'deriva-'))
  const bin = join(raiz, 'bin')
  const testigo = join(raiz, 'claude-corrio')
  mkdirSync(bin)
  writeFileSync(join(bin, 'claude'), `#!/bin/sh\ntouch "${testigo}"\nexit 0\n`)
  chmodSync(join(bin, 'claude'), 0o755)
  const base = join(raiz, 'fortress.db')
  const db = new Database(base)
  db.exec('CREATE TABLE projects (id TEXT, name TEXT, path TEXT, trusted INTEGER NOT NULL)')
  db.prepare('INSERT INTO projects VALUES (?, ?, ?, 0)').run('p1', 'ajeno', raiz)
  db.close()

  const script = join(import.meta.dirname, 'medir-deriva.ts')
  const cargador = join(import.meta.dirname, 'lib/cargar-ts.mjs')
  const argumentos = ['--import', cargador, script, 'ajeno', 'src', '--base', base]
  const r = spawnSync(process.execPath, argumentos, {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` }
  })

  assert.notEqual(r.status, 0)
  assert.match(r.stderr.toString(), /no es de confianza/)
  assert.equal(existsSync(testigo), false)
})
