import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** El layout leido del FUENTE, como sus hermanos: no se pintan componentes. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const SCAN = 'src/presentation/components/scan/'

describe('los tres pisos fijos se apilan, cada uno bajo el anterior', () => {
  it('1: la fila del proyecto —nombre y botones— se pega arriba del todo', () => {
    const cabecera = fuente(`${SCAN}ScanHeader.tsx`)

    expect(cabecera).toMatch(/bg-background sticky top-0 z-30/)
    expect(cabecera).toMatch(/<div ref=\{cabecera\} className=\{FIJA\}>/)
    // Y en la fila fija van los botones, que es lo que el operador necesita.
    expect(cabecera).toMatch(/className=\{FIJA\}>[\s\S]*<ScanActions project=\{project\} \/>/)
  })

  it('el score de 64px y la ruta NO se fijan: se irian comiendo las filas', () => {
    const cabecera = fuente(`${SCAN}ScanHeader.tsx`)

    expect(cabecera).toMatch(/<header className="flex flex-wrap items-center gap-4 border-b/)
    expect(cabecera).not.toMatch(/sticky[^"']*>\s*<ScoreGauge/)
  })

  it('2: las barras se pegan bajo la cabecera, opacas', () => {
    expect(fuente(`${SCAN}TableroDeHallazgos.tsx`)).toMatch(
      /bg-background sticky top-\[var\(--cabecera,0px\)\] z-20/
    )
  })

  it('3: la fila de columnas se pega bajo la cabecera MAS las barras', () => {
    expect(fuente(`${SCAN}FindingsTable.tsx`)).toMatch(
      /sticky top-\[calc\(var\(--cabecera,0px\)_\+_var\(--franja,0px\)\)\] z-10/
    )
  })

  it('el orden de apilado no deja que uno tape al de arriba: 30 > 20 > 10', () => {
    expect(fuente(`${SCAN}ScanHeader.tsx`)).toContain('z-30')
    expect(fuente(`${SCAN}TableroDeHallazgos.tsx`)).toContain('z-20')
    expect(fuente(`${SCAN}FindingsTable.tsx`)).toContain('z-10')
  })
})

describe('los altos se MIDEN: un numero fijo taparia filas', () => {
  it('cada franja publica su alto real como variable CSS', () => {
    const hook = fuente('src/presentation/hooks/useFranjaFija.ts')

    expect(hook).toMatch(/new ResizeObserver/)
    expect(hook).toMatch(/\{ \[nombre\]: `\$\{alto\}px` \}/)
    expect(fuente(`${SCAN}ScanView.tsx`)).toMatch(/useFranjaFija\('--cabecera'\)/)
    expect(fuente(`${SCAN}TableroDeHallazgos.tsx`)).toMatch(/useFranjaFija\('--franja'\)/)
  })

  it('sin seleccion ni lote, la franja no ocupa NI UN PIXEL', () => {
    const tablero = fuente(`${SCAN}TableroDeHallazgos.tsx`)

    expect(tablero).toMatch(/const vacia = tablero\.seleccion\.size === 0 && !verLote/)
    expect(tablero).toMatch(/className=\{vacia \? FRANJA : `\$\{FRANJA\} py-2`\}/)
    expect(tablero).not.toMatch(/const FRANJA = '[^']*py-2/)
  })
})
