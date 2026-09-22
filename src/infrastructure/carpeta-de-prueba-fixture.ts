import { mkdtempSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const creadas: string[] = []

/**
 * Una carpeta temporal BAJO EL HOME —no en /tmp, que dentro de la caja es un
 * tmpfs— que este fichero de test recuerda para borrarla en su `afterAll`.
 * Un `mkdtemp` a secas dejo 71 carpetas huerfanas tras dos gates (medido).
 */
export function carpetaDePrueba(prefijo: string): string {
  const carpeta = mkdtempSync(join(homedir(), prefijo))
  creadas.push(carpeta)
  return carpeta
}

/** Para `afterAll`: borra lo que ESTE fichero de test creo, y nada mas. */
export function limpiarCarpetasDePrueba(): void {
  for (const carpeta of creadas.splice(0)) rmSync(carpeta, { recursive: true, force: true })
}
