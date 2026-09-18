import { noSePudoVerificar } from '@domain/chat/no-se-pudo-verificar'
import type { VerificacionDelArbol } from '@domain/chat/verificacion-del-arbol'
import { runCommand } from '../probe/run-command'

/** El typecheck de un proyecto ajeno no deberia tardar mas que esto. */
const TIMEOUT_MS = 180_000

/**
 * Verifica que el arbol sigue compilando tras un arreglo. typecheck es rapido y
 * caza lo que rompe de verdad; lint y test los corre el propio agente al
 * autoverificarse. Si el proyecto no tiene el script, no se puede comprobar
 * aqui y se da por bueno (no se bloquea la construccion por falta de tooling).
 *
 * Corre por `runCommand` y no por un `execFile` propio, y ese es el arreglo de
 * fondo. `npm run typecheck` EJECUTA CODIGO DEL REPO AJENO —el script del
 * package.json que se esta arreglando—, asi que heredar el entorno del proceso
 * le entregaba las llaves de la sesion viva del operador: el agente ssh, el
 * llavero, X11. Es el tercer sitio con el mismo agujero; los dos anteriores se
 * taparon poniendo `buildGateEnv` a mano en cada uno.
 *
 * Poner la lista blanca por tercera vez habria cerrado este y dejado el patron
 * intacto para el cuarto. Reusar el helper que ya la aplica deja un `execFile`
 * crudo MENOS en el codigo, que es la unica prevencion que no depende de que
 * alguien se acuerde.
 */
export async function verificarArbol(cwd: string): Promise<VerificacionDelArbol> {
  const salida = await runCommand('npm', ['run', 'typecheck'], cwd, TIMEOUT_MS)
  if (salida.code === 0) return 'verde'
  // `runCommand` junta stdout y stderr, asi que la senal se busca en los dos.
  return noSePudoVerificar(salida) ? 'desconocida' : 'rojo'
}
