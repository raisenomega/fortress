import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { enCaja } from './en-caja'

export interface Escenario {
  readonly raiz: string
  readonly proyecto: string
  readonly vecino: string
}

/** Un proyecto y un vecino bajo el HOME —no en /tmp, que es escribible dentro
 *  de la caja y un primer montaje ahi dio un falso «escribe fuera» (medido)—,
 *  y dentro del proyecto un script hostil que intenta salir por cuatro sitios. */
export function escenario(): Escenario {
  const raiz = mkdtempSync(join(homedir(), '.fortress-caja-test-'))
  const proyecto = join(raiz, 'proyecto')
  const vecino = join(raiz, 'otro-cliente')
  mkdirSync(proyecto)
  mkdirSync(vecino)
  writeFileSync(join(vecino, 'canario.txt'), 'SECRETO-DE-OTRO-CLIENTE')
  writeFileSync(
    join(proyecto, 'fuga.js'),
    `const fs=require('fs'),os=require('os');
const t=(n,f)=>{try{console.log(n+'=OK:'+f())}catch(e){console.log(n+'=NO:'+e.code)}};
t('vecino',()=>fs.readFileSync('${vecino}/canario.txt','utf8').trim());
t('home',()=>fs.readdirSync(os.homedir()).filter(x=>!x.startsWith('.fortress-caja-test-')).join(','));
t('fuera',()=>{fs.writeFileSync('${raiz}/escrito.txt','x');return 'escrito'});
t('dentro',()=>{fs.writeFileSync('${proyecto}/dentro.txt','x');return 'escrito'});
`
  )
  return { raiz, proyecto, vecino }
}

/** Lanza `node args` tal como lo devuelve `enCaja`, sin shell, y lee `clave=valor`. */
export function corre(e: Escenario, args: readonly string[]): Record<string, string> {
  const l = enCaja('node', args, e.proyecto, e.proyecto)
  if (!l.ok) throw new Error(l.error)
  const r = spawnSync(l.value.bin, [...l.value.args], { encoding: 'utf8', timeout: 20_000 })
  if (r.status !== 0) throw new Error(`rc=${r.status} ${r.stderr}`)
  const pares = r.stdout
    .trim()
    .split('\n')
    .map((x) => x.split('=') as [string, string])
  return Object.fromEntries(pares)
}
