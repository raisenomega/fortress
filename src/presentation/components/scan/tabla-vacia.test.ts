import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TODAS } from '@domain/project/filtro-del-tablero'
import type { Tablero } from '../../hooks/useTablero'
import { hayFiltro } from './props-de-la-tabla'

const tablero = (severidad: string, estado: string): Tablero =>
  ({ filtro: { severidad, estado } }) as unknown as Tablero

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

describe('una tabla vacia tiene TRES motivos, no dos', () => {
  it('sin filtros, vacia significa que no hay hallazgos', () => {
    expect(hayFiltro(tablero(TODAS, TODAS))).toBe(false)
  })

  it('con CUALQUIERA de los dos ejes puesto, vacia significa FILTRADA', () => {
    // Decir «el escaneo no encontro nada» con quinientos hallazgos detras, y el
    // chip marcando 0 justo encima, es una contradiccion en la misma pantalla.
    expect(hayFiltro(tablero('CRITICAL', TODAS))).toBe(true)
    expect(hayFiltro(tablero(TODAS, 'mitigados'))).toBe(true)
    expect(hayFiltro(tablero('CRITICAL', 'mitigados'))).toBe(true)
  })

  it('el tercer caso tiene su texto y su salida, que no lanza nada', () => {
    const texto = fuente('src/presentation/components/scan/FindingsEmpty.tsx')

    expect(texto).toContain('Ningun hallazgo con este filtro')
    expect(texto).toContain('Quitar el filtro')
    // Y NO el de siempre: ese afirmaria algo que el escaneo no dijo.
    expect(texto).toMatch(/if \(filtrando\)/)
  })

  it('quitar el filtro devuelve los DOS ejes a «todas», no solo uno', () => {
    const texto = fuente('src/presentation/components/scan/props-de-la-tabla.ts')

    expect(texto).toMatch(/elegirSeveridad\(TODAS\)[\s\S]{0,60}elegirEstado\(TODAS\)/)
  })
})
