import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { spawnCommand } from './spawn-command'

/** Un binario de mentira con el cuerpo de shell que se le de. */
function fake(body: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-bin-'))
  const bin = join(dir, 'fake')
  writeFileSync(bin, `#!/bin/sh\n${body}\n`)
  chmodSync(bin, 0o755)
  return bin
}

const correr = async (): Promise<string> => {
  // El chivato solo cuenta lo que ve en su entorno.
  const chivato = fake('echo "CI=[$CI] PATH=[$PATH] MARCA=[$FCC_MARCA]"')
  const salido = await spawnCommand(chivato, 'chivato', [], tmpdir(), 5000)
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

describe('lo que el repo auditado escupe y acaba en la autopsia', () => {
  it('un secreto impreso no llega en claro a la evidencia', async () => {
    const bin = fake("echo 'ANTHROPIC_API_KEY=sk-ant-secreta1'; echo 'Bearer ajeno1' >&2")
    const salido = await spawnCommand(bin, 'fake', [], tmpdir(), 5000)

    expect(salido.stdoutTail).not.toContain('sk-ant-')
    expect(salido.stderrTail).not.toContain('ajeno1')
  })

  it('tampoco cuando el recorte de la cola parte el secreto en dos', async () => {
    // Si se redactara DESPUES de `tail`, el trozo que sobrevive al corte ya no
    // casa con ninguna regex y se asienta en claro en un libro append-only.
    const linea = '.'.repeat(100) + 'sk-ant-' + 'x'.repeat(20) + '.'.repeat(1976)
    const bin = fake(`printf '%s' '${linea}'`)
    const salido = await spawnCommand(bin, 'fake', [], tmpdir(), 5000)

    expect(salido.stdoutTail).not.toContain('ant-')
    expect(salido.stdoutTail).toContain('***')
  })
})
