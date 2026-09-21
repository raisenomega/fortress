import { createServer, connect } from 'node:net'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface RegistroLocal {
  readonly puerto: number
  readonly cerrar: () => void
}

/** Un «registro» en 127.0.0.1 que contesta REGISTRO, y un IMPOSTOR en el mismo
 *  puerto de OTRA direccion de loopback: si el proxy conectase a un destino
 *  distinto del pedido, contestaria el impostor y no el registro. */
export async function registroLocal(): Promise<RegistroLocal> {
  const registro = createServer((s) => s.end('REGISTRO'))
  await new Promise<void>((r) => registro.listen(0, '127.0.0.1', r))
  const puerto = (registro.address() as { port: number }).port
  const impostor = createServer((s) => s.end('IMPOSTOR'))
  await new Promise<void>((r) => impostor.listen(puerto, '127.0.0.2', r))
  return { puerto, cerrar: () => (registro.close(), impostor.close()) }
}

export const socketDePrueba = (): string =>
  join(mkdtempSync(join(tmpdir(), 'fortress-proxy-')), 'p.sock')

/** Manda una linea por el socket y devuelve lo que vuelve (cabecera + datos). */
export function tunel(socket: string, linea: string): Promise<string> {
  return new Promise((resolve) => {
    const c = connect(socket)
    let out = ''
    c.on('data', (d) => (out += d.toString('latin1')))
    c.on('close', () => resolve(out))
    c.on('error', () => resolve(out))
    c.write(`${linea}\r\n\r\n`)
    setTimeout(() => c.destroy(), 400)
  })
}
