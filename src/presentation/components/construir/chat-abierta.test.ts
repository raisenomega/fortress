import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** PASO 84: la "Chat" se abre como el Terminal — sin cuadro y a lo ancho.
 *  Mismo molde que ConstruirInput.test.tsx: se lee el fuente y se fijan las
 *  clases; re-anadir una clase de cuadro pone esto rojo. */
const fuente = (nombre: string): string =>
  readFileSync(`src/presentation/components/construir/${nombre}`, 'utf8')

describe('la Chat abierta, sin cuadro y a lo ancho', () => {
  it('el ancho quedo suelto: la vista ya no capa a max-w-2xl', () => {
    expect(fuente('ConstruirView.tsx')).not.toContain('max-w-2xl')
  })

  it('los mensajes sin burbuja: ni borde, ni fondo, ni ancho capado', () => {
    const mensajes = fuente('ConstruirMessages.tsx')
    expect(mensajes).not.toContain('border-border')
    expect(mensajes).not.toContain('bg-primary/10')
    expect(mensajes).not.toContain('max-w-[')
  })

  it('el input sin marco, como el del Terminal', () => {
    const input = fuente('ConstruirInput.tsx')
    expect(input).toContain('border-transparent')
    expect(input).not.toContain('border-border')
  })

  it('la actividad en vivo pinta la palabra con el mapa de colores', () => {
    expect(fuente('LineaDelBorrador.tsx')).toContain('colorDe')
    expect(fuente('ConstruirMessages.tsx')).toContain('LineaDelBorrador')
  })

  it('libre se anuncia GLOBAL en los dos letreros (PASO 112: no es bug, es diseno)', () => {
    expect(fuente('ConstruirView.tsx')).toContain('global, sin proyecto · conversa sin repo')
    expect(fuente('ConstruirModeMenu.tsx')).toContain('global, sin proyecto · conversa sin repo')
  })
})
