import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { spawnCommand } from './spawn-command'

/** Un binario que solo cuenta lo que ve en su entorno. */
function chivato(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-env-'))
  const bin = join(dir, 'chivato')
  writeFileSync(bin, '#!/bin/sh\necho "CI=[$CI] PATH=[$PATH] MARCA=[$FCC_MARCA]"\n')
  chmodSync(bin, 0o755)
  return bin
}

const correr = async (): Promise<string> => {
  const salido = await spawnCommand(chivato(), 'chivato', [], tmpdir(), 5000)
  return salido.stdoutTail
}

afterEach(() => {
  delete process.env.FCC_MARCA
})

describe('el entorno con el que corre un comando del gate', () => {
  it('CI llega al proceso, que es lo que hace salir a los runners', async () => {
    expect(await correr()).toContain('CI=[true]')
  })

  it('el resto del entorno del operador NO llega al repo auditado', async () => {
    // Antes se heredaba entero, y con el viajaban las llaves de la sesion viva
    // del operador a un `preinstall` ajeno. Ahora solo pasa la lista blanca.
    process.env.FCC_MARCA = 'vale'

    const salida = await correr()
    expect(salida).toContain('MARCA=[]')
    // Pero el PATH si viaja: sin el, `npm` ni siquiera se encontraria.
    expect(salida).not.toContain('PATH=[]')
  })

  it('un CI apagado en la shell del operador no manda sobre el gate', async () => {
    // Quien decide como se verifica es el auditor, no el terminal desde el que
    // se abrio la app: si esto se invirtiera, el gate volveria a colgarse.
    process.env.CI = 'false'

    try {
      expect(await correr()).toContain('CI=[true]')
    } finally {
      delete process.env.CI
    }
  })
})
