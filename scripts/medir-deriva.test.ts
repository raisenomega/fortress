import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
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

// Proyecto confiable y la caja entera fingida (bwrap, socat, node): la parada
// llega al spawn y el `claude` falso deja sus args como testigo. Lo que se
// afirma es el cerco de claude-cli.test.ts —solo viaja el MCP que arma
// FORTRESS—: aqui ninguno, y `--strict-mcp-config` cierra el conjunto a vacio,
// para que el hijo no monte ni los servidores globales del operador ni los que
// declare el arbol auditado.
test('cierra el conjunto MCP: --strict-mcp-config viaja y sin servidor alguno', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'deriva-'))
  const bin = join(raiz, 'bin')
  const testigo = join(raiz, 'args-del-cli')
  mkdirSync(bin)
  writeFileSync(join(bin, 'claude'), `#!/bin/sh\nprintf '%s\\n' "$@" > "${testigo}"\nprintf 'key=%s\\n' "$ANTHROPIC_API_KEY" > "${testigo}-key"\nexit 1\n`) // prettier-ignore
  writeFileSync(join(bin, 'bwrap'), '#!/bin/sh\necho fortress-caja-ok\n')
  writeFileSync(join(bin, 'socat'), '#!/bin/sh\nexit 0\n')
  writeFileSync(join(bin, 'node'), '#!/bin/sh\nexit 0\n')
  for (const b of ['claude', 'bwrap', 'socat', 'node']) chmodSync(join(bin, b), 0o755)
  const base = join(raiz, 'fortress.db')
  const db = new Database(base)
  db.exec('CREATE TABLE projects (id TEXT, name TEXT, path TEXT, trusted INTEGER NOT NULL)')
  db.exec(`CREATE TABLE findings (project_id TEXT, file TEXT, line INT,
    identity TEXT, simbolo TEXT, lifecycle TEXT, tipo TEXT)`)
  db.prepare('INSERT INTO projects VALUES (?, ?, ?, 1)').run('p1', 'propio', raiz)
  db.close()

  const script = join(import.meta.dirname, 'medir-deriva.ts')
  const cargador = join(import.meta.dirname, 'lib/cargar-ts.mjs')
  const argumentos = ['--import', cargador, script, 'propio', 'src', '--base', base]
  const r = spawnSync(process.execPath, argumentos, {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}`, ANTHROPIC_API_KEY: 'sk-sintetica' } // prettier-ignore
  })

  assert.match(r.stderr.toString(), /el escaner salio con 1/)
  assert.equal(existsSync(testigo), true)
  const args = readFileSync(testigo, 'utf8').split('\n')
  assert.ok(args.includes('--strict-mcp-config'))
  assert.ok(!args.includes('--mcp-config'))
  assert.equal(readFileSync(`${testigo}-key`, 'utf8'), 'key=\n') // la API key de la shell no viaja
})
