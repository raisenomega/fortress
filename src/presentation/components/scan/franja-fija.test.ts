import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** El layout leido del FUENTE, como sus hermanos: no se pintan componentes. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const SCAN = 'src/presentation/components/scan/'

describe('el bloque de cabecera es UNO solo y se queda fijo', () => {
  it('un unico contenedor sticky, no un sticky por piso', () => {
    const cabecera = fuente(`${SCAN}CabeceraFija.tsx`)

    expect(cabecera).toMatch(/bg-background border-border sticky top-0 z-30/)
    expect(cabecera).toMatch(/<div ref=\{cabecera\} className=\{FIJA\}>/)
  })

  it('y lleva dentro, contiguos, score+nombre+botones, filtros y barras', () => {
    const cabecera = fuente(`${SCAN}CabeceraFija.tsx`)

    for (const pieza of ['<ScanHeader', '<ChipsDelTablero', '<BarrasDelTablero']) {
      expect(cabecera).toContain(pieza)
    }
    // El score es el ancla de la pantalla: viaja con el bloque fijo, no aparte.
    expect(fuente(`${SCAN}ScanHeader.tsx`)).toContain('<ScoreGauge')
    expect(fuente(`${SCAN}ScanHeader.tsx`)).not.toMatch(/sticky/)
  })

  it('la fila de columnas cuelga de UNA variable, no de un calc encadenado', () => {
    const tabla = fuente(`${SCAN}FindingsTable.tsx`)

    expect(tabla).toMatch(/bg-background sticky top-\[var\(--cabecera,0px\)\] z-20/)
    expect(tabla).not.toMatch(/calc\(/)
  })

  it('el alto se MIDE: un numero fijo taparia filas', () => {
    const hook = fuente('src/presentation/hooks/useFranjaFija.ts')

    expect(hook).toMatch(/new ResizeObserver/)
    expect(hook).toMatch(/\{ \[nombre\]: `\$\{alto\}px` \}/)
    expect(fuente(`${SCAN}ScanView.tsx`)).toMatch(/useFranjaFija\('--cabecera'\)/)
  })
})

describe('lo que NO entra en el bloque fijo, y la excepcion', () => {
  it('los avisos scrollean: crecen, y una cabecera que crece sola marea', () => {
    const avisos = fuente(`${SCAN}AvisosDelEscaneo.tsx`)

    for (const pieza of ['<Notice', '<CoberturaNotice', '<ParadaEnVivo']) {
      expect(avisos).toContain(pieza)
    }
    expect(avisos).not.toContain('<ScanProgress')
    expect(fuente(`${SCAN}CabeceraFija.tsx`)).not.toContain('<AvisosDelEscaneo')
  })

  it('EXCEPCION: el progreso va fijo, y SOLO mientras se escanea', () => {
    const cabecera = fuente(`${SCAN}CabeceraFija.tsx`)

    expect(cabecera).toMatch(/\{running \? <ScanProgress text=\{progress\} \/> : null\}/)
  })

  it('y los avisos viven en la zona que scrollea, con las filas', () => {
    const tablero = fuente(`${SCAN}TableroDeHallazgos.tsx`)

    expect(tablero).toMatch(/<AvisosDelEscaneo project=\{project\} \/>[\s\S]*<FindingsTable/)
  })
})
