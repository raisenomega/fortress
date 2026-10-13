import assert from 'node:assert/strict'
import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

// Uso: node --test scripts/caduca-cadena-sintetica.test.ts
// Simula la app abierta con un `pgrep` falso que siempre la encuentra, y un HOME
// de usar y tirar: si una guarda faltara, el script crearia alli su fortress.db.
const lanzar = (raiz: string, args: string[]): SpawnSyncReturns<Buffer> => {
  const bin = join(raiz, 'bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'pgrep'), '#!/bin/sh\nexit 0\n')
  chmodSync(join(bin, 'pgrep'), 0o755)
  const script = join(import.meta.dirname, 'caduca-cadena-sintetica.ts')
  return spawnSync(process.execPath, [script, ...args], {
    env: { ...process.env, HOME: raiz, PATH: `${bin}:${process.env.PATH ?? ''}` }
  })
}

test('con la app abierta falla cerrado y no abre la base', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'caduca-'))
  const base = join(raiz, 'copia.db')
  const r = lanzar(raiz, ['--base', base])

  assert.notEqual(r.status, 0)
  assert.match(r.stderr.toString(), /fail-closed: la app esta abierta/)
  assert.equal(existsSync(base), false)
})

test('sin --base falla cerrado y no crea ni abre nada', () => {
  for (const args of [[], ['--base'], ['--base', '--otro']]) {
    const raiz = mkdtempSync(join(tmpdir(), 'caduca-'))
    const datos = join(raiz, '.config/fortress-command-center')
    mkdirSync(datos, { recursive: true })
    const r = lanzar(raiz, args)
    assert.notEqual(r.status, 0)
    assert.match(r.stderr.toString(), /fail-closed: --base es obligatoria/)
    assert.equal(existsSync(join(datos, 'fortress.db')), false)
  }
})
