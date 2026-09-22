import { statfsSync } from 'node:fs'

/** `MSDOS_SUPER_MAGIC`: vfat, el sistema de ficheros de un USB de fabrica. Sin
 *  enlaces simbolicos ni bit de ejecucion: `npm` no puede crear `node_modules/.bin`. */
const VFAT = 0x4d44

/**
 * Si el disco donde vive `ruta` admite enlaces simbolicos. Se le pregunta al
 * sistema de ficheros (statfs), sin crear nada dentro del proyecto. Medido el
 * 2026-09-21 en un USB vfat, con y sin caja. Ante la duda —una ruta que no
 * existe— se contesta que si: esta sonda solo afina la causa, no decide nada.
 */
export function admiteEnlaces(ruta: string): boolean {
  try {
    return statfsSync(ruta).type !== VFAT
  } catch {
    return true
  }
}
