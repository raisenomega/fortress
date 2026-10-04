import { spawn } from 'child_process'
import { afterAll, describe, expect, it } from 'vitest'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { enCaja } from './en-caja'

afterAll(limpiarCarpetasDePrueba)

const GORDO = 'x'.repeat(200 * 1024)

/** ADR-112: la CLASE (argv revienta) y el CANAL (stdin cruza bwrap), medidos
 *  con procesos reales — no con la palabra de nadie. */
describe('el transporte, medido de verdad', () => {
  it('la CLASE: un solo argumento de 200 KB revienta el spawn en Linux (E2BIG)', async () => {
    // Node lo LANZA sincrono desde spawn() (medido), no como evento 'error':
    // el arnes atrapa las dos vias para que la prueba mida el SO, no a Node.
    const error = await new Promise<NodeJS.ErrnoException | null>((res) => {
      try {
        const child = spawn('/bin/echo', [GORDO], { stdio: 'ignore' })
        child.on('error', (e) => res(e as NodeJS.ErrnoException))
        child.on('close', () => res(null))
      } catch (e) {
        res(e as NodeJS.ErrnoException)
      }
    })
    expect(error?.code).toBe('E2BIG')
  })

  it('el CANAL: 200 KB cruzan el bwrap REAL por stdin, enteros', async () => {
    const dir = carpetaDePrueba('.fortress-stdin-')
    const caja = enCaja('wc', ['-c'], dir, dir)
    if (!caja.ok) throw new Error(caja.error)
    const salida = await new Promise<string>((res, rej) => {
      const child = spawn(caja.value.bin, [...caja.value.args])
      let out = ''
      child.stdout.on('data', (d: Buffer) => (out += d.toString()))
      child.on('close', () => res(out))
      child.on('error', rej)
      child.stdin.write(GORDO)
      child.stdin.end()
    })
    expect(salida.trim()).toBe(String(200 * 1024))
  })
})
