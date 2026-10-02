/**
 * Las tres formas que el guardian NO debe dar por acotadas, escritas PARA el test y
 * no recortadas de un fichero real: un recorte seria producto en git y
 * envejeceria con el. El nombre lleva `fixture` para que `ES_TEST` lo excluya
 * del barrido — si no, su `...process.env` de ejemplo contaria como fuga.
 */

/** La fuga: el entorno entero por delante. */
export const CRUDO = `
import { execFile } from 'child_process'
function entornoSucio(): NodeJS.ProcessEnv {
  return { ...process.env, LC_ALL: 'C' }
}
export function git(cwd: string): void {
  const options = { cwd, env: entornoSucio(), timeout: 1000 }
  execFile('git', ['status'], options, () => undefined)
}
`

/**
 * El MIXTO, que es el caso peligroso: copia claves nombradas **y ademas**
 * esparce el entorno entero. Tiene la pinta de una lista blanca y no lo es, asi
 * que la regla tiene que mirar las dos cosas y no solo una.
 */
export const MIXTO = `
import { execFile } from 'child_process'
function entornoMixto(): NodeJS.ProcessEnv {
  const env: Record<string, string> = {}
  env['PATH'] = process.env['PATH'] ?? ''
  return { ...process.env, ...env }
}
export function git(cwd: string): void {
  const options = { cwd, env: entornoMixto(), timeout: 1000 }
  execFile('git', ['status'], options, () => undefined)
}
`

/**
 * El OPACO: no esparce `process.env`, pero tampoco construye nada que se pueda
 * ver — su entorno sale de una funcion que el guardian no puede seguir. No
 * heredar NO es prueba de estar acotado.
 */
export const OPACO = `
import { execFile } from 'child_process'
function entornoOpaco(): NodeJS.ProcessEnv {
  const base = leerDelDisco()
  return { ...base, LC_ALL: 'C' }
}
export function git(cwd: string): void {
  const options = { cwd, env: entornoOpaco(), timeout: 1000 }
  execFile('git', ['status'], options, () => undefined)
}
`
