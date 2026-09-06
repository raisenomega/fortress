import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { IPC } from './channels'

/** Los dos turnos del sistema, tal como el codigo los pide y la tabla de
 *  docs/IPC.md los nombra en su columna "Guards". */
export const GUARDS = ['guardRun', 'guardMerge'] as const

const DIR = join('src', 'infrastructure', 'ipc')
const CANALES = IPC as Record<string, string>

/** Cuerpo de cada funcion de nivel superior, por nombre. El corte es la llave
 *  sola en la columna cero, que es donde acaban aqui: prettier no deja otra. */
function cuerpos(src: string): Map<string, string> {
  const re = /^(?:export )?(?:async )?function (\w+)(?:<[^>]*>)?\([\s\S]*?^}/gm
  return new Map([...src.matchAll(re)].map((m) => [m[1], m[0]]))
}

/**
 * Que guards toma un registro: los que llama el, y los que llama a traves de un
 * ayudante del mismo fichero — `build-handlers` no escribe `guardRun` en ninguno
 * de sus tres handlers, lo toma dentro de `withGuard`, y leer solo la llamada
 * directa daria por descubiertos tres canales que si tienen turno.
 */
function guardsDe(trozo: string, fns: Map<string, string>): string[] {
  const pide = (texto: string, guard: string): boolean => texto.includes(`${guard}(`)
  const ayudantes = [...fns].filter(([n]) => new RegExp(`\\b${n}\\(`).test(trozo))
  return GUARDS.filter((g) => pide(trozo, g) || ayudantes.some(([, c]) => pide(c, g)))
}

/**
 * Que guards toma DE VERDAD cada canal, leido de los registros de este
 * directorio. Se parte por `ipcMain.handle(IPC.x` y no por fichero porque el
 * turno vive en el handler concreto: `scan-handlers` registra seis canales y
 * solo `scan:run` lo toma. Mirar el fichero entero daria por guardados los
 * otros cinco, que es justo el error que este parser existe para no cometer.
 *
 * Se llama `leeGuards...` y no `guards...` porque el barrido de innegociables
 * reserva ese prefijo para quien TOMA un turno, y esto solo lo lee.
 */
export function leeGuardsDelCodigo(): Map<string, readonly string[]> {
  const out = new Map<string, readonly string[]>()
  const ficheros = readdirSync(DIR).filter((f) => f.endsWith('.ts') && !f.includes('.test.'))
  for (const fichero of ficheros) {
    const fns = cuerpos(readFileSync(join(DIR, fichero), 'utf8'))
    const registros = [...fns].filter(([n]) => n.startsWith('register')).map(([, c]) => c)
    const trozos = registros
      .join('\n')
      .split(/ipcMain\.handle\(\s*IPC\./)
      .slice(1)
    for (const trozo of trozos) {
      const canal = CANALES[trozo.match(/^(\w+)/)?.[1] ?? '']
      if (canal !== undefined) out.set(canal, guardsDe(trozo, fns))
    }
  }
  return out
}
