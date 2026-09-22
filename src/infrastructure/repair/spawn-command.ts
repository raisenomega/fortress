import type { CommandOutcome } from '@domain/repair/gate-result'
import { buildGateEnv } from './gate-env'
import { enCaja } from '../sandbox/en-caja'
import { abrirProxyDeRegistros } from '../sandbox/proxy-de-registros'
import { registrosDelProyecto } from '../sandbox/registros-del-proyecto'
import { retirarSocket, socketNuevo } from '../sandbox/socket-del-proxy'
import { correrEnCaja } from './spawn-command-hijo'
import { sinCaja } from './spawn-command-vida'

/**
 * Corre UN comando del gate, DENTRO DE LA CAJA (ADR-092, clase B): aqui corren
 * `npm ci` y los scripts del repo auditado, con sus `preinstall` y `postinstall`.
 * El worktree es el proyecto que se monta; nada mas del disco se ve. Si la caja
 * no se puede levantar, el comando NO corre: sale con 127 y el motivo, y el
 * gate lo lee como fallo, no como exito (fail-closed, casilla 4).
 *
 * Y CON RED SOLO A LOS REGISTROS (casilla 2): cada comando levanta SU proxy,
 * fuera, con la lista de los ecosistemas que el proyecto declara; dentro, el
 * puente de `socat` es la unica salida. Ni red abierta ni red muerta: la tabla.
 * Sin cache compartida entre clientes —el HOME de la caja es un tmpfs—: cada
 * `npm ci` descarga de nuevo a traves del proxy. Mas lento, y aislado.
 *
 * El entorno es lista blanca, no herencia, y se compone al lanzar y no al cargar
 * el modulo: `augmentPath()` completa el PATH en el arranque mutando `process.env`.
 */
export async function spawnCommand(
  bin: string,
  key: string,
  args: readonly string[],
  cwd: string,
  timeoutMs: number,
  owner: string | null = null
): Promise<CommandOutcome> {
  const startedAt = Date.now()
  const env = buildGateEnv(process.env)
  const socket = socketNuevo()
  const proxy = await abrirProxyDeRegistros(socket, registrosDelProyecto(cwd))
  try {
    const caja = enCaja(bin, args, cwd, cwd, env.PATH, [], proxy.socket)
    if (!caja.ok) return sinCaja(key, startedAt, caja.error)
    return await correrEnCaja(caja.value, { key, cwd, timeoutMs, owner, startedAt })
  } finally {
    await proxy.cerrar()
    retirarSocket(socket)
  }
}
