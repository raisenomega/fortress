import { describe, expect, it } from 'vitest'
import { con } from './evidencia-fixture'
import { modulosAplicables } from './modulos-aplicables'

/** Cada senal de la tabla de ADR-083, una a una y sin ayuda de las demas. */
const CASOS: ReadonlyArray<readonly [string, readonly string[], readonly string[], string]> = [
  ['la UI de React delata accesibilidad', ['src/ui/App.tsx'], [], 'M9'],
  ['tambien un .vue, que ES_FUENTE no ve', ['src/ui/App.vue'], [], 'M9'],
  ['una dependencia de IA delata gobernanza', ['src/a.ts'], ['openai'], 'M5'],
  ['y el scope tambien: @anthropic-ai/sdk', ['src/a.ts'], ['@anthropic-ai/sdk'], 'M5'],
  ['un manifiesto de paquetes delata supply-chain', ['package.json'], [], 'M4'],
  ['un workflow de CI delata el SDLC', ['.github/workflows/ci.yml'], [], 'M7'],
  ['un docker-compose delata DR/BCP', ['docker-compose.yml'], [], 'M2'],
  ['y un .tf tambien, este por sufijo', ['infra/main.tf'], [], 'M2']
]

describe('deteccion determinista de modulos', () => {
  it.each(CASOS)('%s', (_titulo, ficheros, dependencias, esperado) => {
    expect(modulosAplicables(con(ficheros, dependencias)).aplicables).toContain(esperado)
  })

  it('un package.json ANIDADO no cuenta: la senal es la raiz', () => {
    const { aplicables } = modulosAplicables(con(['vendor/lib/package.json']))

    expect(aplicables).not.toContain('M4')
  })

  it('la deteccion no depende del orden ni del numero de senales', () => {
    const uno = modulosAplicables(con(['package.json', 'src/App.tsx'], ['openai']))
    const otro = modulosAplicables(con(['src/App.tsx', 'package.json'], ['openai']))

    expect(uno).toEqual(otro)
    // M1, M6 y M10 aplican SIEMPRE: salen sin senal que los delate.
    expect(uno.aplicables).toEqual(['M1', 'M4', 'M5', 'M6', 'M9', 'M10'])
  })
})
