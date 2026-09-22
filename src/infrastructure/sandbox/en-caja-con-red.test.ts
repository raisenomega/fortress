import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { corre, escenario } from './fuga-fixture'
import { abrirProxyDeRegistros, type ProxyDeRegistros } from './proxy-de-registros'
import { registroLocal, type RegistroLocal } from './proxy-fixture'
import { retirarSocket, socketNuevo } from './socket-del-proxy'

/**
 * La red de la clase B, de punta a punta y SIN internet: un proceso dentro de la
 * caja habla con el puente (127.0.0.1:3128), el puente con el socket del proxy,
 * el proxy —fuera— con un «registro» local. Lo que decide es la lista del proxy.
 */
const e = escenario()
const socket = socketNuevo()
let registro: RegistroLocal
let proxy: ProxyDeRegistros

/** Un cliente CONNECT dentro de la caja, con reintentos por si el puente aun arranca. */
const cliente = (puerto: number, host = '127.0.0.1'): string =>
  `const net=require('net');let n=0;const go=()=>{const s=net.connect(3128,'127.0.0.1');let o='',err=null;` +
  `s.on('connect',()=>s.write('CONNECT ${host}:${puerto} HTTP/1.1\\r\\n\\r\\n'));s.on('data',d=>{o+=d});s.on('error',x=>{err=x});` +
  `s.on('close',()=>{if(err){if(++n<30)setTimeout(go,100);else console.log('red=NO:'+err.code)}` +
  `else console.log('red='+(o.includes('REGISTRO')?'OK':'NO:'+o.slice(0,16).trim()))})};go()`

beforeAll(async () => {
  registro = await registroLocal()
  proxy = await abrirProxyDeRegistros(socket, ['127.0.0.1'], registro.puerto)
})
afterAll(async () => {
  await proxy.cerrar()
  retirarSocket(socket)
  registro.cerrar()
})

describe('la clase B sale por el proxy de registros, y solo por el', () => {
  it('con el socket del proxy: el tunel llega AL registro desde dentro de la caja', async () => {
    expect((await corre(e, ['-e', cliente(registro.puerto)], socket))['red']).toBe('OK')
  })

  it('un host fuera de la lista del proxy: 403 — la tabla manda, no el proceso', async () => {
    const r = await corre(e, ['-e', cliente(registro.puerto, 'localhost')], socket)
    expect(r['red']).toMatch(/^NO:HTTP\/1\.1 403/)
  })

  it('sin socket no hay puente: la caja sigue sin red', async () => {
    expect((await corre(e, ['-e', cliente(registro.puerto)]))['red']).toMatch(/^NO:E/)
  })
})
