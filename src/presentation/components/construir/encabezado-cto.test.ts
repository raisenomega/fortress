import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** PASO 152 (Sello 3a): la izquierda del encabezado pinta el EFECTO app-wide
 *  (consumido del view-model, sin recomputar el modo), y el centro del CTO deja
 *  de mentir con "· sin repo". Molde de la casa: se lee el fuente y se pinea. */

const fuente = (nombre: string): string =>
  readFileSync(`src/presentation/components/construir/${nombre}`, 'utf8')

const vista = fuente('ConstruirView.tsx')
const etiqueta = fuente('EtiquetaDelEfecto.tsx')

describe('encabezado del CTO: izquierda = efecto real, centro sin mentira', () => {
  it('T3: el centro ya no cuelga "· sin repo" del modo; conserva "nunca firma"', () => {
    expect(vista).not.toContain('nunca firma · sin repo')
    expect(vista).toContain('piensa y mide, nunca firma')
  })

  it('T2: la izquierda consume el efecto del view-model; el modo no se deriva aqui', () => {
    expect(vista).toContain('project.efecto')
    expect(vista).toContain('<EtiquetaDelEfecto')
    expect(etiqueta).toContain('etiquetaDelEfecto')
    // El modo lo decide el origen (effectiveMode), nunca la vista ni la etiqueta.
    expect(vista).not.toContain('effectiveMode')
    expect(etiqueta).not.toContain('effectiveMode')
  })
})
