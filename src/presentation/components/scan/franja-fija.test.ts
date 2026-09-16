import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** El layout leido del FUENTE, como sus hermanos: no se pintan componentes. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const SCAN = 'src/presentation/components/scan/'

describe('con la tabla larga, la franja de arriba no se va con el scroll', () => {
  it('las barras del tablero se quedan pegadas al borde, opacas', () => {
    const tablero = fuente(`${SCAN}TableroDeHallazgos.tsx`)

    // Opaca y por encima: las filas pasan por DEBAJO, no a traves.
    expect(tablero).toMatch(/ref=\{franja\}[^>]*bg-background sticky top-0 z-20/)
  })

  it('la cabecera de columnas se pega BAJO la franja, no encima de ella', () => {
    const tabla = fuente(`${SCAN}FindingsTable.tsx`)

    expect(tabla).toMatch(/bg-background sticky top-\[var\(--franja\)\] z-10/)
  })

  it('el alto de la franja se MIDE: un numero fijo taparia la primera fila', () => {
    const hook = fuente('src/presentation/hooks/useFranjaFija.ts')

    expect(hook).toMatch(/new ResizeObserver/)
    expect(hook).toMatch(/'--franja': `\$\{alto\}px`/)
    expect(fuente(`${SCAN}TableroDeHallazgos.tsx`)).toMatch(/style=\{bajoLaFranja\}/)
  })

  it('su linea inferior va en sombra: con border-collapse el borde se queda atras', () => {
    const tabla = fuente(`${SCAN}FindingsTable.tsx`)

    expect(tabla).toMatch(/shadow-\[0_1px_0_0_hsl\(var\(--border\)\)\]/)
    expect(tabla).not.toMatch(/<tr className="border-b/)
  })

  it('la cabecera del PROYECTO si se va: con la tabla larga, el alto manda', () => {
    expect(fuente(`${SCAN}ScanView.tsx`)).not.toMatch(/sticky/)
  })
})
