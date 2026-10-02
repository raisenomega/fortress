/**
 * Las dos formas que el guardian SI debe dar por acotadas, escritas PARA el test y
 * no recortadas de un fichero real: un recorte seria producto en git y
 * envejeceria con el. El nombre lleva `fixture` para que `ES_TEST` lo excluya
 * del barrido — si no, su `...process.env` de ejemplo contaria como fuga.
 */

/** La forma de `entornoDelMerge` tras ADR-110: lista blanca desde `{}`. */
export const LISTA_BLANCA = `
import { execFile } from 'child_process'
const COPIADAS = ['PATH', 'HOME']
function entornoDelMerge(): NodeJS.ProcessEnv {
  const env: Record<string, string> = {}
  for (const clave of COPIADAS) {
    const valor = process.env[clave]
    if (valor !== undefined) env[clave] = valor
  }
  return { ...env, LC_ALL: 'C' }
}
export function git(cwd: string): void {
  const env = entornoDelMerge()
  const options = { cwd, env, timeout: 1000 }
  execFile('git', ['status'], options, () => undefined)
}
`

/** El recorte historico, bendecido por nombre y con sus pruebas aparte. */
export const RECORTE = `
import { execFile } from 'child_process'
function entornoDelMerge(): NodeJS.ProcessEnv {
  return { ...buildEnv(null), LC_ALL: 'C' }
}
export function git(cwd: string): void {
  const options = { cwd, env: entornoDelMerge(), timeout: 1000 }
  execFile('git', ['status'], options, () => undefined)
}
`
