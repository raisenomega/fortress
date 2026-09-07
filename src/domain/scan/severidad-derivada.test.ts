import { describe, expect, it } from 'vitest'
import type { Ejes } from './ejes-de-severidad'
import { bandaDe, severidadDerivada } from './severidad-derivada'

const ejes = (alcance: Ejes['alcance'], efecto: Ejes['efecto'], estado: Ejes['estado']): Ejes => ({ alcance, efecto, estado }) // prettier-ignore

/**
 * Los cinco casos REALES de mailbd-main que ADR-080 usa como fixtures, con la
 * banda que el escaner les puso sin rubrica al lado. La tabla se prueba sin
 * modelo: los ejes van escritos a mano, y lo unico que el escaner tendra que
 * acertar son tres palabras de una lista.
 */
const MAILBD: readonly [string, Ejes, string][] = [
  ['precio mutable por peticion anonima (hoy LOW, MEDIUM y HIGH en tres filas)', ejes('anonimo', 'dinero', 'explotable-hoy'), 'CRITICAL'], // prettier-ignore
  ['replay anonimo revierte reembolsos a completed (hoy MEDIUM)', ejes('anonimo', 'dinero', 'explotable-hoy'), 'CRITICAL'], // prettier-ignore
  ['relay de correo abierto a clientes reales (hoy MEDIUM y HIGH)', ejes('anonimo', 'datos-de-terceros', 'explotable-hoy'), 'CRITICAL'], // prettier-ignore
  ['cart_abandonment UPDATE por cualquier autenticado no admin (hoy HIGH)', ejes('autenticado', 'integridad', 'explotable-hoy'), 'HIGH'], // prettier-ignore
  ['error.message crudo a un llamador anonimo (hoy LOW)', ejes('anonimo', 'informacion', 'defensa-en-profundidad'), 'LOW'] // prettier-ignore
]

describe('la tabla de ADR-080 sobre los casos reales de mailbd', () => {
  it.each(MAILBD)('%s → %s', (_nombre, e, banda) => {
    // La mutacion que importa: sin la fila CRITICAL de la tabla, el precio
    // anonimo cae a HIGH y este test lo dice.
    expect(bandaDe(e)).toBe(banda)
  })
})

describe('las filas que mailbd no ejercita', () => {
  it('requiere-condicion es MEDIUM sea quien sea y toque lo que toque', () => {
    expect(bandaDe(ejes('anonimo', 'dinero', 'requiere-condicion'))).toBe('MEDIUM')
    expect(bandaDe(ejes('local', 'informacion', 'requiere-condicion'))).toBe('MEDIUM')
  })

  it('privilegiado o local con un efecto que cruza el perimetro: HIGH, no CRITICAL', () => {
    // Para llegar hace falta lo que un anonimo no tiene.
    expect(bandaDe(ejes('privilegiado', 'dinero', 'explotable-hoy'))).toBe('HIGH')
    expect(bandaDe(ejes('local', 'ejecucion', 'explotable-hoy'))).toBe('HIGH')
  })

  it('un anonimo que solo obtiene informacion, explotable hoy: HIGH', () => {
    expect(bandaDe(ejes('anonimo', 'informacion', 'explotable-hoy'))).toBe('HIGH')
  })

  it('"cruzar a datos ajenos" lo dicen los efectos: propio es HIGH, ajeno es CRITICAL', () => {
    expect(bandaDe(ejes('autenticado', 'integridad', 'explotable-hoy'))).toBe('HIGH')
    expect(bandaDe(ejes('autenticado', 'datos-de-terceros', 'explotable-hoy'))).toBe('CRITICAL')
  })
})

describe('la regla sin-ejes: null, nunca una banda inventada', () => {
  it('falta un eje', () => {
    expect(severidadDerivada({ alcance: 'anonimo', efecto: 'dinero' })).toBeNull()
  })

  it('un valor fuera del vocabulario, aunque los otros dos griten CRITICAL', () => {
    expect(severidadDerivada({ alcance: 'todos', efecto: 'dinero', estado: 'explotable-hoy' })).toBeNull() // prettier-ignore
    expect(severidadDerivada({ alcance: 'anonimo', efecto: 'dinero', estado: 'explotable' })).toBeNull() // prettier-ignore
  })

  it('los tres validos: la banda de la tabla', () => {
    expect(severidadDerivada({ alcance: 'anonimo', efecto: 'dinero', estado: 'explotable-hoy' })).toBe('CRITICAL') // prettier-ignore
  })
})
