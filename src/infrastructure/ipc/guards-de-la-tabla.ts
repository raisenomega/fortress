import { readFileSync } from 'fs'
import { join } from 'path'
import { GUARDS } from './guards-del-codigo'

const TABLA = join('docs', 'IPC.md')

/** Las celdas de una fila markdown. La barra ESCAPADA no separa: los contratos
 *  la usan dentro (`Result<Proposal \| null>`) y partir por ella los trocea. */
function celdas(linea: string): string[] {
  return linea
    .split(/(?<!\\)\|/)
    .slice(1, -1)
    .map((celda) => celda.trim())
}

/**
 * Lo que la tabla de canales DECLARA que toma cada uno.
 *
 * `**sin** guardRun` es una declaracion de AUSENCIA —`repair:withdraw` la
 * escribe a proposito, y su fila explica por que— asi que se borra antes de
 * buscar el nombre: leerla como presencia invertiria justo la fila que mas
 * cuidado tuvo alguien en redactar.
 *
 * Las filas que no son canales caen solas: sin guard en la ultima celda, no
 * entran en ninguna comparacion.
 */
export function leeGuardsDeLaTabla(): Map<string, readonly string[]> {
  const out = new Map<string, readonly string[]>()
  for (const linea of readFileSync(join(process.cwd(), TABLA), 'utf8').split('\n')) {
    if (!linea.startsWith('| `')) continue
    const fila = celdas(linea)
    const declarado = (fila.at(-1) ?? '').replace(/\*\*sin\*\*\s+\w+/g, '')
    out.set(
      fila[0].replace(/`/g, ''),
      GUARDS.filter((g) => declarado.includes(g))
    )
  }
  return out
}
