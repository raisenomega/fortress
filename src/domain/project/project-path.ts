/** Los separadores que valen en las tres formas admitidas. */
const SEPARADOR = /[\\/]/

/**
 * Ruta absoluta en POSIX (`/...`) o Windows (`C:\` o UNC `\\`), y SIN `..`. El
 * renderer no es fuente de confianza: una ruta relativa o con `..` no debe
 * entrar como raiz de proyecto ni recibir un `git init` antes de validarse.
 *
 * El rechazo de `..` estuvo prometido aqui y aplicado en otro sitio: la
 * comprobacion solo miraba el prefijo, asi que `/home/jojo/../../etc` pasaba
 * —y `/a/b/../../../..` normaliza a la raiz—. Un llamante lo habia notado y se
 * defendia por su cuenta (`isSafeParent` en newproject/target-path); los otros
 * dos, no. Ahora la garantia vive donde su propio texto decia que vivia.
 *
 * Se mira por SEGMENTOS y no por subcadena: un `..` dentro de un nombre
 * (`/srv/app..old`) es un directorio legitimo y no sale de ningun sitio.
 */
export function isAbsoluteProjectPath(p: unknown): p is string {
  if (typeof p !== 'string') return false
  const absoluta = p.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(p) || p.startsWith('\\\\')
  return absoluta && !p.split(SEPARADOR).includes('..')
}
