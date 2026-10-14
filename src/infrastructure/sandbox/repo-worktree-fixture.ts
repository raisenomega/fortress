import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { carpetaDePrueba } from '../carpeta-de-prueba-fixture'
import { enCaja } from './en-caja'

export interface RepoConWorktree {
  readonly repo: string
  /** El `.git` COMUN: lo que `gitComunDe(worktree)` devuelve y la caja abre. */
  readonly comun: string
  readonly worktree: string
}

/** Un repo REAL bajo el HOME con un worktree enlazado: el `.git` del worktree es
 *  un FICHERO gitdir, y su `.git` comun (`<repo>/.git`) es el que la caja monta
 *  en ESCRITURA —el camino de ADR-092 que el fix contiene—. */
export function repoConWorktree(): RepoConWorktree {
  const repo = carpetaDePrueba('.fortress-wt-repo-')
  const g = (...a: string[]): string =>
    execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...a], { cwd: repo, encoding: 'utf8' })
  g('init', '-q', '-b', 'main')
  g('config', 'user.email', 't@t')
  g('config', 'user.name', 't')
  writeFileSync(join(repo, 'a.txt'), 'a')
  g('add', 'a.txt')
  g('commit', '-q', '-m', 'base')
  const worktree = join(repo, 'wt')
  g('worktree', 'add', '-q', worktree, 'HEAD')
  return { repo, comun: join(repo, '.git'), worktree }
}

/** Script hostil: intenta PLANTAR ejecucion en el `.git` comun y luego demuestra
 *  que el motor sigue vivo (commit + worktree). `clave=valor` por linea. Sin
 *  comillas invertidas dentro: cerrarian la plantilla (ver fuga-fixture). */
const hostil = (c: string): string => `
const cp=require('child_process'),fs=require('fs');
const C=${JSON.stringify(c)};
const G=(a)=>cp.execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=',...a],{cwd:process.cwd(),encoding:'utf8'});
const t=(n,f)=>{try{process.stdout.write(n+'=OK:'+f()+'\\n')}catch(e){process.stdout.write(n+'=NO:'+(e.code||'err')+'\\n')}};
t('plant_hook',()=>{fs.writeFileSync(C+'/hooks/pre-commit','#!/bin/sh'+String.fromCharCode(10)+'touch '+C+'/HUELLA',{mode:0o755});return 'PLANTADO'});
t('plant_cfg',()=>{fs.appendFileSync(C+'/config','[core]'+String.fromCharCode(10)+'  fsmonitor = touch '+C+'/HUELLA'+String.fromCharCode(10));return 'ESCRITO'});
t('commit',()=>{fs.writeFileSync('dentro.txt','x');G(['add','dentro.txt']);G(['commit','-q','-m','dentro']);return G(['rev-parse','HEAD']).trim()});
t('worktree',()=>{G(['worktree','add','-q','wt2','HEAD']);return fs.existsSync(C+'/worktrees/wt2')?'REGISTRADO':'NO'});
`

/** Quita los overlays de solo-lectura del `.git` comun: el fix REVERTIDO (el
 *  `.git` escribible entero, sin recapar). Es el MUTANTE de la guarda. */
function sinOverlays(args: readonly string[], comun: string): string[] {
  const fuera = (p: string | undefined): boolean =>
    p !== undefined && p.startsWith(`${comun}/`) && /\/(hooks|config|info)$/.test(p)
  const out: string[] = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if ((a === '--ro-bind' || a === '--ro-bind-try') && fuera(args[i + 1])) i += 2
    else if (a !== undefined) out.push(a)
  }
  return out
}

/** Corre el script hostil en la caja REAL y lee `clave=valor`. Con `overlays`
 *  en false corre el MUTANTE (el `.git` sin contener). */
export function correHostil(
  worktree: string,
  comun: string,
  overlays = true
): Record<string, string> {
  writeFileSync(join(worktree, 'hostil.js'), hostil(comun))
  const l = enCaja('node', ['hostil.js'], worktree, worktree, undefined, [], null)
  if (!l.ok) throw new Error(l.error)
  const args = overlays ? [...l.value.args] : sinOverlays(l.value.args, comun)
  const out = execFileSync(l.value.bin, args, { encoding: 'utf8' }).trim()
  return Object.fromEntries(out.split('\n').map((x) => x.split('=') as [string, string]))
}
