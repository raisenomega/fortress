import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fraseDeSeleccion } from './frase-de-seleccion'

describe('la barra no miente sobre lo que vas a verificar', () => {
  it('con la seleccion fuera de la vista, lo DICE', () => {
    // La seleccion persiste al cambiar de chip. Sin este segundo numero, la
    // barra diria «5 seleccionados» sobre una tabla donde no se ve ninguno.
    expect(fraseDeSeleccion(5, 0)).toBe('5 seleccionados (0 visibles)')
  })

  it('parcialmente visible tambien se dice', () => {
    expect(fraseDeSeleccion(5, 2)).toBe('5 seleccionados (2 visibles)')
  })

  it('cuando todos estan delante, el parentesis sobra', () => {
    expect(fraseDeSeleccion(3, 3)).toBe('3 seleccionados')
  })

  it('uno se dice en singular, tambien dentro del parentesis', () => {
    expect(fraseDeSeleccion(1, 1)).toBe('1 seleccionado')
    expect(fraseDeSeleccion(4, 1)).toBe('4 seleccionados (1 visible)')
  })
})

describe('la cajita solo esta donde la accion aplica', () => {
  it('la fila la pinta SOLO si la accion aplica de verdad', () => {
    // Ofrecer un clic que el proceso principal va a rechazar es peor que no
    // ofrecerlo: en un chip sin filas verificables no aparece ninguna cajita, y
    // eso informa sin gastar nada.
    const fuente = readFileSync(join(process.cwd(), 'src/presentation/components/scan/FindingRow.tsx'), 'utf8') // prettier-ignore

    expect(fuente).toMatch(/\{sePuedeVerificar \? \(\s*<CajitaDeSeleccion/)
  })

  it('y ese «aplica» lo decide `verificable`, no el ciclo de vida a secas', () => {
    // Con `lifecycle === 'MITIGATED'` a secas, un mitigado DESCARTADO tenia
    // cajita: el operador podia mandar a verificar lo que el mismo aparto.
    const fuente = readFileSync(join(process.cwd(), 'src/presentation/components/scan/FindingRow.tsx'), 'utf8') // prettier-ignore

    expect(fuente).toMatch(/const sePuedeVerificar = verificable\(finding\)/)
  })
})
