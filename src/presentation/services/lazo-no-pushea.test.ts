import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** ATERRIZAJE-5, parte 2: el lazo deja el candado de push ABIERTO (cuentas vivas,
 *  push-readiness ya existe) pero JAMAS pushea — el push sigue siendo el boton
 *  humano. Pin: ningun servicio del camino del lazo llama a `push.run`/`pushRun`. */
const SERVICIOS = [
  'auto-salto-del-cto',
  'auto-reporte-del-terminal',
  'empujon-del-cto',
  'comitear-del-lazo',
  'avanzar-cola',
  'arbol-del-lazo',
  'dirigir-al-cto',
  'cargar-cola-del-lazo'
]

describe('el lazo JAMAS pushea (ATERRIZAJE-5, parte 2)', () => {
  it.each(SERVICIOS)('%s no llama a push.run / pushRun', (servicio) => {
    const src = readFileSync(`src/presentation/services/${servicio}.ts`, 'utf8')
    expect(src).not.toMatch(/push\.run|pushRun/i)
  })
})
