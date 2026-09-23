import { tipoDeLaIdentidad } from '../project/finding-identity'
import { sanearParaPrompt } from '../shared/sanear-para-prompt'
import { RAIZ } from './dividir-en-paradas'

/** Lo minimo de una viva registrada para recordarsela al escaner. */
export interface FilaRegistrada {
  readonly file: string
  readonly line: number | null
  readonly identity: string
  readonly simbolo: string | null
  readonly lifecycle: string
}

/** Hoy el proyecto mas cargado tiene 161 vivas y una carpeta 34: todo cabe. El
 *  tope existe para que un corpus futuro no reviente el prompt. */
export const MAX_REGISTRADAS = 200

/** Una ruta de parada cubre lo que cuelga de ella; la raiz, lo que no cuelga de ninguna. */
const enAlcance = (file: string, rutas: readonly string[] | undefined): boolean =>
  rutas === undefined || rutas.length === 0
    ? true
    : rutas.some((r) => (r === RAIZ ? !file.includes('/') : file === r || file.startsWith(`${r}/`)))

/** `fichero:linea tipo simbolo`. El simbolo lo escribio el modelo: se sanea. */
const linea = (f: FilaRegistrada): string => {
  const simbolo =
    f.simbolo === null || f.simbolo === '' ? '' : ` ${sanearParaPrompt(f.simbolo, 60)}`
  return `${f.file}:${f.line ?? '-'} ${tipoDeLaIdentidad(f.identity) ?? 'otro'}${simbolo}`
}

/**
 * Las vivas ya registradas en las carpetas que ESTA parada recorre (ADR-101,
 * palanca 1). El escaner no tenia memoria y elegia el tipo desde cero cada
 * corrida, entre vecinos que oscilan; con esto ve que tipo le puso a esa fila
 * la ultima vez. Solo lo consume el prompt: no toca clave, sync ni base.
 */
export function registradasDeLaParada(
  vivas: readonly FilaRegistrada[],
  rutas?: readonly string[]
): readonly string[] {
  return vivas
    .filter((f) => f.lifecycle !== 'EXTINCT' && enAlcance(f.file, rutas))
    .sort((a, b) => a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0))
    .slice(0, MAX_REGISTRADAS)
    .map(linea)
}

/** El bloque del prompt, o cadena vacia si no hay nada registrado. NO pide
 *  omitir nada: ADR-065 sigue mandando y la ausencia no mata. */
export function bloqueDeMemoria(registradas: readonly string[]): string {
  if (registradas.length === 0) return ''
  return [
    `Lo que FORTRESS ya tiene registrado en este alcance (${registradas.length}, como fichero:linea tipo, y el simbolo si consta):`, // prettier-ignore
    ...registradas.map((r) => `- ${r}`),
    'Si vuelves a encontrar un defecto ya registrado, conserva su tipo y su linea salvo que el',
    'codigo haya cambiado; NO lo reescribas con un tipo vecino. Lo nuevo, reportalo como',
    'siempre: esta lista no te pide omitir nada.'
  ].join('\n')
}
