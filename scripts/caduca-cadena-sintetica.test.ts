import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

// Uso: node --test scripts/caduca-cadena-sintetica.test.ts
// Simula la app abierta con un `pgrep` falso que siempre la encuentra, y un HOME
// de usar y tirar: si la guarda faltara, el script crearia alli su fortress.db.
test('con la app abierta falla cerrado y no abre la base', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'caduca-'))
  const bin = join(raiz, 'bin')
  const datos = join(raiz, '.config/fortress-command-center')
  mkdirSync(bin)
  mkdirSync(datos, { recursive: true })
  writeFileSync(join(bin, 'pgrep'), '#!/bin/sh\nexit 0\n')
  chmodSync(join(bin, 'pgrep'), 0o755)

  const script = join(import.meta.dirname, 'caduca-cadena-sintetica.ts')
  const r = spawnSync(process.execPath, [script], {
    env: { ...process.env, HOME: raiz, PATH: `${bin}:${process.env.PATH ?? ''}` }
  })

  assert.notEqual(r.status, 0)
  assert.match(r.stderr.toString(), /fail-closed: la app esta abierta/)
  assert.equal(existsSync(join(datos, 'fortress.db')), false)
})
