import { redactSecrets } from '@domain/chat/tool-detail'

/**
 * ADR-115 A1 — las lineas que dicen POR QUE cayo un comando del gate, recogidas
 * mientras llega la salida. La cola de `TAIL_CHARS` no basta: el buffer rota en
 * vuelo, y el lint imprime su error ANTES que cientos de warnings de otros
 * ficheros. Sin estas lineas, una vuelta tras el rojo (B2) no tendria que darle
 * al generador mas que ruido.
 */
export const MAX_LINEAS_DE_ERROR = 40
const MAX_CHARS_POR_LINEA = 300

// eslint: `  13:1  error  mensaje  regla` bajo la cabecera del fichero.
const ESLINT_ERROR = /^\s+\d+:\d+\s+error\s/
const ESLINT_CABECERA = /^(?:\/|[\w.@-]+\/)\S*\.(?:[cm]?[jt]sx?)$/
// tsc: `src/x.ts(12,3): error TS2345: ...` (trae su fichero).
const TSC_ERROR = /error TS\d+:/
// vitest: el test que falla, la asercion y donde.
const VITEST_ERROR = /^\s*(?:FAIL\s|×\s|AssertionError|Error:|❯\s\S+:\d+:\d+)/
// Se tacha ANTES de recortar: un secreto partido por el corte no lo reconoce
// ninguna regex (la misma razon que en la cola de `spawn-command-hijo`).
const acotar = (linea: string): string => redactSecrets(linea).slice(0, MAX_CHARS_POR_LINEA)
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

export interface Recolector {
  readonly anadir: (trozo: string) => void
  readonly lineas: () => readonly string[]
}

/** Un recolector POR FLUJO (stdout y stderr no se mezclan a media linea): guarda
 *  la linea a medias entre trozos, recuerda la ultima cabecera de eslint (su
 *  error no lleva fichero) y deja de guardar al tope. Leer no cambia nada. */
export function recolectorDeErrores(): Recolector {
  const vistas: string[] = []
  let pendiente = ''
  let fichero = ''
  const clasificar = (cruda: string, cabecera: string): string | null => {
    const linea = cruda.replace(ANSI, '').trimEnd()
    if (ESLINT_ERROR.test(linea)) return `${cabecera} ${linea.trimStart()}`.trim()
    if (TSC_ERROR.test(linea) || VITEST_ERROR.test(linea)) return linea.trim()
    return null
  }
  const mirar = (cruda: string): void => {
    const limpia = cruda.replace(ANSI, '').trimEnd()
    if (ESLINT_CABECERA.test(limpia)) fichero = limpia
    const error = clasificar(cruda, fichero)
    if (error !== null && vistas.length < MAX_LINEAS_DE_ERROR) vistas.push(acotar(error)) // prettier-ignore
  }
  return {
    anadir: (trozo) => {
      const partes = (pendiente + trozo).split('\n')
      pendiente = partes.pop() ?? ''
      partes.forEach(mirar)
    },
    lineas: () => {
      const ultima = pendiente === '' ? null : clasificar(pendiente, fichero)
      const caben = ultima !== null && vistas.length < MAX_LINEAS_DE_ERROR
      return caben ? [...vistas, acotar(ultima)] : [...vistas]
    }
  }
}
