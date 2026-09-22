import { err, ok, type Result } from '@domain/shared/result'
import { argsDelSandbox } from '@domain/sandbox/config-del-cli'
import { directorioDeNode } from './lo-que-ve-la-caja'
import { registrosDelProyecto } from './registros-del-proyecto'
import { cajaDisponible } from './sonda-de-bwrap'

/**
 * Los args de un `claude -p` con el sandbox del CLI puesto (ADR-092, clase A).
 *
 * Va por `--settings` y por spawn: el `.claude/` del cliente ni se toca. La
 * red se abre SOLO a los registros de los ecosistemas que el proyecto declara
 * en su raiz —sin manifiesto, sin red—, y la lectura se cierra a lo que hace
 * falta para correr: el proyecto y el `node` del PATH.
 *
 * FAIL-CLOSED (casilla 4): el CLI sabe fallar cerrado (`failIfUnavailable`),
 * pero eso lo decide EL, con sus dependencias. FORTRESS pregunta ANTES con su
 * propia sonda, la misma de la clase B: sin `bwrap` y `socat` no hay turno.
 * Un `Result` fallido aqui es «no se lanza», no «se lanza sin caja».
 */
export function conSandbox(
  args: readonly string[],
  projectPath: string,
  path = process.env.PATH ?? ''
): Result<readonly string[]> {
  const disponible = cajaDisponible(path)
  if (!disponible.ok) return err(`sin-caja:${disponible.error}`)

  const node = directorioDeNode(path)
  if (node === null) return err('sin-caja:falta-node')

  const sandbox = argsDelSandbox({
    proyecto: projectPath,
    soloLectura: [node],
    registros: registrosDelProyecto(projectPath)
  })
  return sandbox.ok ? ok([...args, ...sandbox.value]) : err(`sin-caja:${sandbox.error}`)
}
