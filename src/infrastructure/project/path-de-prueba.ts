import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PATH_ORIGINAL = process.env.PATH

/**
 * Deja el PATH como la maquina donde se midio `raisen-nucleo`: `python3` si,
 * `python` NO. Un PATH de mentira y no el de verdad, para que el test diga lo
 * mismo en la maquina del operador que en la de quien lo herede.
 */
export function pathSinPython(): void {
  const bin = mkdtempSync(join(tmpdir(), 'fortress-bin-'))
  writeFileSync(join(bin, 'python3'), '#!/bin/sh\n', { mode: 0o755 })
  process.env.PATH = bin
}

export function restaurarPath(): void {
  process.env.PATH = PATH_ORIGINAL
}

/**
 * Un proyecto de mentira con el `.claude/settings.json` que se le pase, o sin
 * el si se le pasa null. Escribe en esa ruta EXACTA porque es donde el pre-vuelo
 * mira: si cambiara, estos tests se caerian en vez de pasar mirando a otro sitio.
 */
export function proyectoCon(settings: unknown): string {
  const raiz = mkdtempSync(join(tmpdir(), 'fortress-proy-'))
  if (settings === null) return raiz

  mkdirSync(join(raiz, '.claude'))
  writeFileSync(join(raiz, '.claude', 'settings.json'), JSON.stringify(settings))
  return raiz
}

/** El mismo, con UN hook PreToolUse y el comando que se le pase. */
export const proyectoConHook = (comando: string): string =>
  proyectoCon({ hooks: { PreToolUse: [{ matcher: 'Write|Edit|MultiEdit', hooks: [{ type: 'command', command: comando }] }] } }) // prettier-ignore
