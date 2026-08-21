import { describe, expect, it } from 'vitest'
import { buildScanPrompt } from '@domain/scan/scan-prompt'
import { discoverCorpus } from './discover-corpus'

/**
 * Lo que se comprueba sobre el REPO REAL, y por eso solo mira ficheros
 * VERSIONADOS: un worktree limpio materializa unicamente lo que git tiene, y el
 * gate del motor corre justo ahi. Los documentos internos (gitignored) se
 * prueban con un proyecto controlado en `discover-corpus-carpetas.test.ts`.
 */
describe('FORTRESS se reconoce a si misma con el mismo codigo que mira a los demas', () => {
  // Lo que queda aqui SI corre sobre el repo real, y solo mira lo VERSIONADO:
  // que FORTRESS ordeno su propio corpus donde su descubridor lo busca.
  const propio = discoverCorpus(process.cwd())
  const paths = propio.docs.map((d) => d.path)

  it('encuentra dentro de docs/ el corpus que ordeno alli', () => {
    expect(paths).toContain('docs/SECURITY-MODEL.md')
    expect(paths).toContain('docs/ARCHITECTURE.md')
    expect(paths).toContain('docs/PRINCIPLES.md')
  })

  it('cita la carpeta de decisiones como estructural, sin enumerar los ADRs', () => {
    expect(propio.directories).toEqual(['docs/', 'docs/DECISIONS/'])
  })

  it('categoriza cada hallazgo por su nombre, no por donde esta', () => {
    const seguridad = propio.docs.filter((d) => d.category === 'security').map((d) => d.path)
    expect(seguridad).toEqual(['docs/SECURITY-MODEL.md'])
  })
})

describe('el prompt que sale de todo esto', () => {
  it('el escaneo de FORTRESS cita su modelo de amenazas por su ruta real', () => {
    const prompt = buildScanPrompt('FORTRESS', discoverCorpus(process.cwd()))
    expect(prompt).toContain('docs/SECURITY-MODEL.md')
  })
})
