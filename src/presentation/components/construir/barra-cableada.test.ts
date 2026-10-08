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
    expect(barra).toContain('elegirHilo(')
  })

  it('el toggle vive del store PROPIO de la barra', () => {
    const toggle = fuente('BarraToggle.tsx')
    expect(toggle).toContain('useBarraStore')
    expect(toggle).toContain('toggle')
  })
})
