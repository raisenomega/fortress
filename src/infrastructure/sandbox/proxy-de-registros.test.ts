import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { existsSync, statSync } from 'node:fs'
import { abrirProxyDeRegistros, type ProxyDeRegistros } from './proxy-de-registros'
import { registroLocal, socketDePrueba, tunel, type RegistroLocal } from './proxy-fixture'

let registro: RegistroLocal
let proxy: ProxyDeRegistros
const socket = socketDePrueba()
const pide = (linea: string): Promise<string> => tunel(socket, linea)

beforeAll(async () => {
  registro = await registroLocal()
  proxy = await abrirProxyDeRegistros(socket, ['127.0.0.1'], registro.puerto)
})

afterAll(async () => {
  await proxy.cerrar()
  registro.cerrar()
})

describe('el proxy abre solo hacia la lista, y solo por el puerto TLS', () => {
  it('el socket es solo del operador', () => {
    expect(statSync(socket).mode & 0o777).toBe(0o600)
  })

  it('un host fuera de la lista: 403 y se cierra, sin conectar a ningun sitio', async () => {
    expect(await pide(`CONNECT localhost:${registro.puerto} HTTP/1.1`)).toMatch(/^HTTP\/1\.1 403/)
  })

  it('un host de la lista por otro puerto: 403', async () => {
    expect(await pide(`CONNECT 127.0.0.1:${registro.puerto + 1} HTTP/1.1`)).toMatch(
      /^HTTP\/1\.1 403/
    )
  })

  it('basura que no es CONNECT: 403', async () => {
    expect(await pide('GET / HTTP/1.1')).toMatch(/^HTTP\/1\.1 403/)
  })

  it('un host de la lista por el puerto TLS: 200 y el tunel llega AL registro', async () => {
    const out = await pide(`CONNECT 127.0.0.1:${registro.puerto} HTTP/1.1`)
    expect(out).toMatch(/^HTTP\/1\.1 200/)
    expect(out).toContain('REGISTRO')
    expect(out).not.toContain('IMPOSTOR')
  })

  it('el impostor de al lado no esta en la lista: 403', async () => {
    expect(await pide(`CONNECT 127.0.0.2:${registro.puerto} HTTP/1.1`)).toMatch(/^HTTP\/1\.1 403/)
  })

  it('cerrar retira el socket', async () => {
    const otro = socketDePrueba()
    const p = await abrirProxyDeRegistros(otro, [])
    expect(existsSync(otro)).toBe(true)
    await p.cerrar()
    expect(existsSync(otro)).toBe(false)
  })
})
