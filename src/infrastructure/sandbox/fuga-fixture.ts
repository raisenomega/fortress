import { execFile } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { carpetaDePrueba } from '../carpeta-de-prueba-fixture'
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
  const raiz = carpetaDePrueba('.fortress-caja-test-')
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

/** Lanza `node args` tal como lo devuelve `enCaja`, sin shell, y lee `clave=valor`.
 *  ASINCRONO a proposito: el proxy de registros vive en ESTE proceso, y un
 *  `spawnSync` lo dejaria sin event loop mientras la caja le habla (medido). */
export function corre(
  e: Escenario,
  args: readonly string[],
  socket: string | null = null
): Promise<Record<string, string>> {
  // prettier-ignore
  const l = enCaja('node', args, e.proyecto, e.proyecto, undefined, [], socket)
  if (!l.ok) return Promise.reject(new Error(l.error))
  return new Promise((resolve, reject) => {
    const opciones = { encoding: 'utf8' as const, timeout: 20_000 }
    execFile(l.value.bin, [...l.value.args], opciones, (error, stdout, stderr) => {
      if (error !== null) return reject(new Error(`rc=${error.code} ${stderr}`))
      const pares = stdout
        .trim()
        .split('\n')
        .map((x) => x.split('=') as [string, string])
      resolve(Object.fromEntries(pares))
    })
  })
}
