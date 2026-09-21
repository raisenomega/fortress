import { createServer, connect, type Server, type Socket } from 'node:net'
import { chmodSync, mkdirSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'
import { leerConnect, permitido, PUERTO_TLS } from '@domain/sandbox/peticion-connect'

export interface ProxyDeRegistros {
  readonly socket: string
  readonly cerrar: () => Promise<void>
}

const NEGADO = 'HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'
const ABIERTO = 'HTTP/1.1 200 Connection Established\r\n\r\n'

/**
 * La unica puerta de la caja hacia fuera (ADR-092, casilla 2): un tunel CONNECT
 * que solo abre hacia los hosts de la lista, y solo por 443.
 *
 * VIVE FUERA DE LA CAJA, en el proceso de FORTRESS, y escucha en un socket UNIX
 * que la caja ve en solo lectura. Lo que corre dentro no puede tocar la lista:
 * ni leerla, ni ensancharla. Solo puede pedir, y el proxy decide con la tabla
 * cerrada de `registros-de-paquetes`.
 *
 * NO inspecciona TLS: casa el nombre que el cliente pide en el CONNECT. Un
 * cliente que mienta en ese nombre acaba hablando con el host que dijo, no con
 * otro: la decision es por destino real, porque `connect` va al host del CONNECT.
 *
 * Medido el 2026-09-21 con `npm view` real a traves de socat + este tunel.
 */
export function abrirProxyDeRegistros(
  socket: string,
  hosts: readonly string[],
  /** Solo para tests: un registro local no puede escuchar en 443. */
  puerto = PUERTO_TLS
): Promise<ProxyDeRegistros> {
  mkdirSync(dirname(socket), { recursive: true, mode: 0o700 })
  rmSync(socket, { force: true })
  const servidor = createServer((cliente) => atender(cliente, hosts, puerto))
  return new Promise((resolve, reject) => {
    servidor.once('error', reject)
    servidor.listen(socket, () => {
      chmodSync(socket, 0o600)
      resolve({ socket, cerrar: () => cerrar(servidor, socket) })
    })
  })
}

function atender(cliente: Socket, hosts: readonly string[], puerto: number): void {
  cliente.once('data', (primero: Buffer) => {
    const peticion = leerConnect(primero.toString('latin1'))
    if (peticion === null || !permitido(peticion, hosts, puerto)) {
      cliente.end(NEGADO)
      return
    }
    const destino = connect(peticion.puerto, peticion.host, () => {
      cliente.write(ABIERTO)
      destino.pipe(cliente)
      cliente.pipe(destino)
    })
    destino.on('error', () => cliente.destroy())
    cliente.on('error', () => destino.destroy())
    cliente.on('close', () => destino.destroy())
  })
  cliente.on('error', () => cliente.destroy())
}

function cerrar(servidor: Server, socket: string): Promise<void> {
  return new Promise((resolve) => {
    servidor.close(() => {
      rmSync(socket, { force: true })
      resolve()
    })
  })
}
