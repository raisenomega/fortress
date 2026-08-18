import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { git } from './merge-repo-fixture'

const GUION = [
  '#!/bin/sh',
  'case "$2" in',
  '  typecheck) grep -q TYPE a.ts && exit 1; exit 0 ;;',
  '  lint) sed -n "s/^ERROR/a.ts: error/p" a.ts; grep -q "^ERROR" a.ts && exit 1; exit 0 ;;',
  '  test:unit) grep -q ROTO a.ts && exit 1; exit 0 ;;',
  'esac',
  'exit 0'
].join('\n')

/**
 * npm fake que juzga por el CONTENIDO del arbol. Es lo que permite que la base
 * y el fix den resultados distintos sin que la prueba tenga que saber en cual
 * de los dos esta corriendo: exactamente el escenario que mide la herencia.
 */
export function npmSegunContenido(): string {
  const bin = join(mkdtempSync(join(tmpdir(), 'fcc-her-')), 'npm')
  writeFileSync(bin, `${GUION}\n`)
  chmodSync(bin, 0o755)
  return bin
}

/** Repo con una base y un fix encima; cada uno con su contenido de a.ts. */
export function repoConBase(base: string, fix: string): { dir: string; baseSha: string } {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-herrepo-'))
  const escribir = (texto: string): void => writeFileSync(join(dir, 'a.ts'), texto)
  git(dir, 'init', '-b', 'main')
  git(dir, 'config', 'user.email', 'test@fortress')
  git(dir, 'config', 'user.name', 'test')
  git(dir, 'config', 'commit.gpgsign', 'false')
  const scripts = { typecheck: 'true', lint: 'true', 'test:unit': 'true' }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts }))
  escribir(base)
  git(dir, 'add', '.')
  git(dir, 'commit', '-m', 'base')
  const baseSha = git(dir, 'rev-parse', 'HEAD').trim()

  git(dir, 'checkout', '--quiet', '-b', 'fix')
  escribir(fix)
  git(dir, 'add', '.')
  git(dir, 'commit', '-m', 'fix')
  return { dir, baseSha }
}
