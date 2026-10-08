import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** PASO 116: pins a la INVOCACION del cableado de la barra (la clase 91/96). */
const fuente = (nombre: string): string =>
  readFileSync(`src/presentation/components/construir/${nombre}`, 'utf8')

describe('la barra del Chat, cableada', () => {
  it('la vista pasa a FILA con la barra y su toggle; la principal ni se toca', () => {
    const vista = fuente('ConstruirView.tsx')
    expect(vista).toContain('flex-row')
    expect(vista).toContain('<BarraDelChat')
    expect(vista).toContain('<BarraToggle')
    expect(vista).not.toContain('useSidebarStore')
  })

  it('la barra carga las listas del organizador y el clic elige el hilo', () => {
    const barra = fuente('BarraDelChat.tsx')
    expect(barra).toContain('cargarListas(')
    expect(barra).toContain('<FilaDeHilo') // la fila es quien invoca elegirHilo
    expect(fuente('FilaDeHilo.tsx')).toContain('elegirHilo(')
  })

  it('el toggle vive del store PROPIO de la barra', () => {
    const toggle = fuente('BarraToggle.tsx')
    expect(toggle).toContain('useBarraStore')
    expect(toggle).toContain('toggle')
  })

  it('Fase 3: cabecera con nuevo/crear/buscar, carpetas abren su pagina', () => {
    const cabecera = fuente('CabeceraDeLaBarra.tsx')
    expect(cabecera).toContain('nuevoHiloSuelto(')
    expect(cabecera).toContain('crearCarpetaYEntrar(')
    const barra = fuente('BarraDelChat.tsx')
    expect(barra).toContain('<CabeceraDeLaBarra')
    expect(barra).toContain('abrirCarpeta(')
    expect(barra).toContain('buscarHilos(')
  })

  it('Fase 3: la pagina de carpeta lista lo suyo y pare dentro', () => {
    const pagina = fuente('PaginaDeCarpeta.tsx')
    expect(pagina).toContain('hilosDeCarpeta(')
    expect(pagina).toContain('nuevoHiloEnCarpeta(')
    expect(pagina).toContain('elegirHilo(')
    expect(fuente('ConstruirView.tsx')).toContain('<PaginaDeCarpeta')
  })
})
