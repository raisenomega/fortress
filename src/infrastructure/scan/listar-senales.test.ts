import { rmSync } from 'fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SIN_DECLARACION } from '@domain/scan/declaracion-de-modulos'
import { esDeCarpeta } from '@domain/scan/parada'
import { listarFuente } from './listar-fuente'
import { listarSenales } from './listar-senales'
import { medirProyecto } from './medir-proyecto'
import { repoCon } from './repo-fixture'

/** Un proyecto con UNA sola fuente y cuatro senales que NO son fuente. */
const PROYECTO = {
  'src/domain/a.ts': 'export const a = 1\n',
  'src/ui/App.vue': '<template />\n',
  'package.json': '{"dependencies":{"openai":"1.0.0"}}',
  '.github/workflows/ci.yml': 'on: push\n',
  'README.md': '# hola\n'
}

let repo: string

beforeEach(() => {
  repo = repoCon(PROYECTO)
})

afterEach(() => {
  rmSync(repo, { recursive: true, force: true })
})

describe('las senales se leen sin tocar ES_FUENTE', () => {
  it('la senal entra en su lectura y NO en la de fuente', async () => {
    expect(await listarSenales(repo)).toContain('src/ui/App.vue')
    expect(await listarFuente(repo)).not.toContain('src/ui/App.vue')
  })

  it('lo que no es ni fuente ni senal no entra en ninguna', async () => {
    expect(await listarSenales(repo)).not.toContain('README.md')
    expect(await listarFuente(repo)).not.toContain('README.md')
  })

  it('detectar M9 por un .vue NO mueve el numero con el que el escaneo se compromete', async () => {
    const manifiesto = await medirProyecto(repo, SIN_DECLARACION)

    // Si alguien metiera .vue (o .yml, o package.json) en ES_FUENTE, el
    // compromiso de ADR-082 crece sin que nadie lo decida: esto lo cazaria.
    expect(manifiesto.ficherosTotal).toBe(1)
    expect(manifiesto.paradas.filter(esDeCarpeta).map((p) => p.carpeta)).toEqual(['src/domain'])
    expect(manifiesto.modulosAplicables).toContain('M9')
  })

  it('las tres lecturas suman: fichero raiz, patron de carpeta y dependencia', async () => {
    const { modulosAplicables } = await medirProyecto(repo, SIN_DECLARACION)

    // M1, M6 y M10 son nucleo y aplican siempre; los otros cuatro, por senal.
    expect(modulosAplicables).toEqual(['M1', 'M4', 'M5', 'M6', 'M7', 'M9', 'M10'])
  })
})
